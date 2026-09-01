/**
 * Module Notifications & Communications (Prompt 20)
 * Centre de notifications, Rappel cotisations du 5 du mois, Carte prête, Remboursements & Préférences.
 */
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  BellRing,
  CheckCheck,
  Clock,
  Sliders,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export function NotificationsBoard() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const [preferences, setPreferences] = useState({
    email_enabled: true,
    sms_enabled: true,
    app_enabled: true,
    rappel_echeance_5: true,
    alertes_securite: true,
  });

  const notificationsQuery = useQuery({
    queryKey: ["notifications", "centre"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications_internes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) return [];
      return data ?? [];
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("notifications_internes")
        .update({ is_lue: true })
        .eq("is_lue", false);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Toutes les notifications ont été marquées comme lues.");
      void queryClient.invalidateQueries({ queryKey: ["notifications", "centre"] });
    },
  });

  const preferencesQuery = useQuery({
    queryKey: ["notifications", "preferences", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_notification_preferences" as never)
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as typeof preferences;
    },
  });

  const savePreferencesMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Utilisateur non connecté.");
      const { error } = await supabase
        .from("user_notification_preferences" as never)
        .upsert({ user_id: user.id, ...preferences }, { onConflict: "user_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Préférences enregistrées.");
      void queryClient.invalidateQueries({ queryKey: ["notifications", "preferences", user?.id] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  useEffect(() => {
    if (preferencesQuery.data) setPreferences(preferencesQuery.data);
  }, [preferencesQuery.data]);

  const triggerEcheanceRappelMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("traiter_retards_cotisations_mensuelles" as never);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Procédure de rappel et mise à jour des échéances exécutée avec succès.");
      void queryClient.invalidateQueries({ queryKey: ["notifications", "centre"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const allNotifications = notificationsQuery.data ?? [];
  const filteredNotifications =
    filter === "unread" ? allNotifications.filter((n) => !n.is_lue) : allNotifications;
  const unreadCount = allNotifications.filter((n) => !n.is_lue).length;

  return (
    <div className="space-y-6">
      {/* En-tête du Centre de Notifications */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold font-display tracking-tight flex items-center gap-2">
            <BellRing className="size-6 text-primary" /> Centre de Notifications & Communications
          </h2>
          <p className="text-sm text-muted-foreground">
            Rappels d'échéance le 5 du mois, cartes prêtes, alertes de paiement et sécurité.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending || unreadCount === 0}
            className="gap-2"
          >
            <CheckCheck className="size-4" /> Tout marquer comme lu
          </Button>

          <Button
            size="sm"
            onClick={() => triggerEcheanceRappelMutation.mutate()}
            disabled={triggerEcheanceRappelMutation.isPending}
            className="gap-2 bg-gradient-to-r from-primary to-accent"
          >
            <Clock className="size-4" /> Lancer Rappel Cotisations du 5
          </Button>
        </div>
      </div>

      <Tabs defaultValue="flux" className="space-y-4">
        <TabsList>
          <TabsTrigger value="flux" className="gap-2">
            <Bell className="size-4" /> Mes Notifications ({unreadCount} non lues)
          </TabsTrigger>
          <TabsTrigger value="preferences" className="gap-2">
            <Sliders className="size-4" /> Préférences de Réception
          </TabsTrigger>
        </TabsList>

        <TabsContent value="flux" className="space-y-4">
          <div className="flex items-center gap-2 pb-2">
            <Button
              variant={filter === "all" ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilter("all")}
            >
              Toutes ({allNotifications.length})
            </Button>
            <Button
              variant={filter === "unread" ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilter("unread")}
            >
              Non lues ({unreadCount})
            </Button>
          </div>

          <div className="space-y-3">
            {filteredNotifications.map((notif) => (
              <Card
                key={notif.id}
                className={`border-border/60 transition-all ${
                  !notif.is_lue
                    ? "bg-primary/5 border-primary/30 shadow-sm"
                    : "bg-card/60 opacity-80"
                }`}
              >
                <CardContent className="flex items-start justify-between gap-4 p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 rounded-lg bg-primary/10 p-2 text-primary">
                      <Bell className="size-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-foreground text-sm">{notif.titre}</h4>
                        {!notif.is_lue && (
                          <Badge variant="default" className="text-[10px] bg-primary">
                            Nouveau
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{notif.message}</p>
                      <span className="text-[10px] text-muted-foreground mt-2 block">
                        {new Date(notif.created_at).toLocaleString("fr-FR")}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredNotifications.length === 0 && (
              <Card className="border-dashed border-border bg-card/40 py-12 text-center">
                <CardContent>
                  <Bell className="mx-auto size-10 text-muted-foreground/50 mb-3" />
                  <p className="text-sm font-medium text-foreground">
                    Aucune notification pour le moment.
                  </p>
                  <p className="text-xs text-muted-foreground">Vous êtes parfaitement à jour !</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <Card className="border-border/60 bg-card/80 backdrop-blur max-w-2xl">
            <CardHeader>
              <CardTitle>Canaux & Alertes Automatiques</CardTitle>
              <CardDescription>
                Configurez le mode de réception de vos rappels d'échéance et alertes de sécurité.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-sm">Notifications par Email</h4>
                  <p className="text-xs text-muted-foreground">
                    Recevez vos reçus et appels de cotisations sur votre boîte mail.
                  </p>
                </div>
                <Switch
                  checked={preferences.email_enabled}
                  onCheckedChange={(val) => setPreferences({ ...preferences, email_enabled: val })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-sm">Notifications par SMS (Mobile Money)</h4>
                  <p className="text-xs text-muted-foreground">
                    Rappels instantanés sur M-Pesa, Orange Money ou Airtel Money.
                  </p>
                </div>
                <Switch
                  checked={preferences.sms_enabled}
                  onCheckedChange={(val) => setPreferences({ ...preferences, sms_enabled: val })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-sm">Rappels automatiques avant le 5 du mois</h4>
                  <p className="text-xs text-muted-foreground">
                    Alertes préventives pour éviter tout retard d'échéance.
                  </p>
                </div>
                <Switch
                  checked={preferences.rappel_echeance_5}
                  onCheckedChange={(val) =>
                    setPreferences({ ...preferences, rappel_echeance_5: val })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-sm">Alertes de Sécurité & Connexions</h4>
                  <p className="text-xs text-muted-foreground">
                    Information en cas de connexion sur un nouvel appareil.
                  </p>
                </div>
                <Switch
                  checked={preferences.alertes_securite}
                  onCheckedChange={(val) =>
                    setPreferences({ ...preferences, alertes_securite: val })
                  }
                />
              </div>

              <Button
                onClick={() => savePreferencesMutation.mutate()}
                disabled={savePreferencesMutation.isPending || !user}
                className="w-full"
              >
                {savePreferencesMutation.isPending ? "Enregistrement…" : "Sauvegarder mes préférences"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
