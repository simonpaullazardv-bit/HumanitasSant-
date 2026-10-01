import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { updatePassword } from "@/services/auth.service";
import { supabase } from "@/integrations/supabase/client";

const schema = z
  .object({
    password: z.string().min(8, "8 caractères minimum").max(128),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirm"],
  });

type Values = z.infer<typeof schema>;

export const Route = createFileRoute("/reinitialisation")({
  component: PasswordInitializationPage,
});

function PasswordInitializationPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, home } = useAuth();
  const form = useForm<Values>({ resolver: zodResolver(schema) });

  if (!isLoading && !isAuthenticated) {
    return (
      <section className="mx-auto max-w-xl px-5 py-20 text-center">
        <h1 className="text-2xl font-bold">Session requise</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Connectez-vous pour initialiser votre mot de passe.
        </p>
        <Button className="mt-6" onClick={() => void navigate({ to: "/auth" })}>
          Se connecter
        </Button>
      </section>
    );
  }

  const submit = form.handleSubmit(async ({ password }) => {
    try {
      await updatePassword(password);
      const { error } = await supabase.rpc("mark_password_initialized" as never, {} as never);
      if (error) throw error;
      toast.success("Votre mot de passe personnel est maintenant actif.");
      await navigate({ to: home, replace: true });
    } catch {
      toast.error("Impossible d'initialiser le mot de passe pour le moment.");
    }
  });

  return (
    <section className="relative overflow-hidden py-16 sm:py-24">
      <div className="mx-auto max-w-lg px-5 sm:px-8">
        <div className="rounded-3xl border border-border/80 bg-card p-7 shadow-3d-elevated sm:p-9">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <LockKeyhole className="size-6" />
          </div>
          <h1 className="mt-6 text-2xl font-bold">Initialisez votre mot de passe</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Votre compte Humanitas a été créé avec un mot de passe temporaire. Choisissez maintenant
            votre mot de passe personnel.
          </p>
          <form onSubmit={submit} className="mt-7 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nouveau mot de passe</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                {...form.register("password")}
              />
              {form.formState.errors.password ? (
                <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmer</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                {...form.register("confirm")}
              />
              {form.formState.errors.confirm ? (
                <p className="text-xs text-destructive">{form.formState.errors.confirm.message}</p>
              ) : null}
            </div>
            <div className="flex items-start gap-2 rounded-xl bg-primary/5 p-3 text-xs text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
              <span>
                Après cette étape, vous serez redirigé uniquement vers l’espace correspondant à
                votre rôle et à vos droits.
              </span>
            </div>
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Enregistrement…" : "Activer mon mot de passe"}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}
