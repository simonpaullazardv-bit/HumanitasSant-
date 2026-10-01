import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { LockKeyhole, Mail, ShieldCheck, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import {
  requestPasswordReset,
  signInWithGoogle,
  signInWithIdentifier,
  signUpWithPassword,
} from "@/services/auth.service";
import { IMAGES } from "@/data/site";

const title = "Connexion au portail | Humanitas Santé";
const description =
  "Accédez à votre espace sécurisé Humanitas Santé : adhérent, entreprise, hôpital, coordination, médecine conseil, finance ou administration.";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search["redirect"] === "string" ? (search["redirect"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

const loginSchema = z.object({
  identifier: z.string().trim().min(3, "Identifiant ou email requis").max(255),
  password: z.string().min(8, "8 caractères minimum").max(128),
});

const signupSchema = z
  .object({
    fullName: z.string().trim().min(3, "Nom complet requis").max(120),
    email: z.string().trim().email("Adresse email invalide").max(255),
    phone: z.string().trim().max(30).optional(),
    password: z.string().min(8, "8 caractères minimum").max(128),
    confirm: z.string(),
  })
  .refine((values) => values.password === values.confirm, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirm"],
  });

type LoginValues = z.infer<typeof loginSchema>;
type SignupValues = z.infer<typeof signupSchema>;

/** Valide que la destination post-connexion reste interne au site. */
function safePath(value: string | undefined, fallback: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}

function AuthPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/auth" });
  const { isAuthenticated, isLoading, home, mustChangePassword } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);

  // Un utilisateur déjà connecté n'a rien à faire sur la page de connexion.
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      const stored = sessionStorage.getItem("humanitas:redirect") ?? undefined;
      sessionStorage.removeItem("humanitas:redirect");
      void navigate({
        to: mustChangePassword ? "/reinitialisation" : safePath(search.redirect ?? stored, home),
        replace: true,
      });
    }
  }, [isAuthenticated, isLoading, home, mustChangePassword, navigate, search.redirect]);

  const login = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });
  const signup = useForm<SignupValues>({ resolver: zodResolver(signupSchema) });

  const onLogin = async (values: LoginValues) => {
    try {
      await signInWithIdentifier(values.identifier, values.password);
      toast.success("Connexion réussie");
    } catch (error) {
      toast.error(
        error instanceof Error && error.message.includes("Invalid login")
          ? "Email ou mot de passe incorrect."
          : "Connexion impossible pour le moment.",
      );
    }
  };

  const onSignup = async (values: SignupValues) => {
    try {
      const result = await signUpWithPassword({
        email: values.email,
        password: values.password,
        fullName: values.fullName,
        ...(values.phone ? { phone: values.phone } : {}),
      });
      if (result.session) {
        toast.success("Compte créé, bienvenue chez Humanitas !");
      } else {
        toast.success("Compte créé. Vérifiez votre boîte mail pour confirmer votre adresse.");
      }
      signup.reset();
    } catch (error) {
      toast.error(
        error instanceof Error && error.message.includes("already registered")
          ? "Cette adresse est déjà utilisée."
          : "Inscription impossible pour le moment.",
      );
    }
  };

  const onGoogle = async () => {
    setGoogleLoading(true);
    try {
      const result = await signInWithGoogle(search.redirect);
      if (result.error) {
        toast.error("Connexion Google indisponible.");
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const onForgot = async () => {
    const email = login.getValues("identifier");
    const parsed = z.string().email().safeParse(email);
    if (!parsed.success) {
      toast.error("Renseignez d'abord votre adresse email.");
      return;
    }
    try {
      await requestPasswordReset(parsed.data);
      toast.success("Lien de réinitialisation envoyé.");
    } catch {
      toast.error("Envoi impossible pour le moment.");
    }
  };

  return (
    <section className="relative overflow-hidden py-16 sm:py-24">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="hidden lg:block"
        >
          <div className="flex size-20 items-center justify-center rounded-3xl border border-primary/20 bg-card p-2.5 shadow-3d-soft shadow-glow-primary">
            <img
              src={IMAGES.logo}
              alt="Logo Humanitas"
              width={64}
              height={64}
              className="h-full w-full object-contain"
            />
          </div>
          <h1 className="mt-8 font-display text-4xl font-bold leading-tight text-foreground">
            Portail sécurisé Humanitas Santé
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
            Un espace unique pour les adhérents, les entreprises, les établissements de soins et les
            équipes internes de la mutuelle.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-muted-foreground">
            {[
              "Accès strictement limité à votre rôle",
              "Données chiffrées et journalisées",
              "Carte de membre et cotisations en temps réel",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3">
                <ShieldCheck className="size-4 text-accent" />
                {item}
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="card-3d rounded-3xl border border-border/80 bg-card p-6 shadow-3d-elevated sm:p-8"
        >
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Connexion</TabsTrigger>
              <TabsTrigger value="signup">Créer un compte</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-6">
              <form onSubmit={login.handleSubmit(onLogin)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-identifier">Identifiant / adresse email</Label>
                  <Input
                    id="login-identifier"
                    type="text"
                    autoComplete="username"
                    placeholder="HUM-A-XXXXXXXX ou votre email"
                    {...login.register("identifier")}
                  />
                  {login.formState.errors.identifier && (
                    <p className="text-xs text-destructive">
                      {login.formState.errors.identifier.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Mot de passe</Label>
                  <Input
                    id="login-password"
                    type="password"
                    autoComplete="current-password"
                    {...login.register("password")}
                  />
                  {login.formState.errors.password && (
                    <p className="text-xs text-destructive">
                      {login.formState.errors.password.message}
                    </p>
                  )}
                </div>
                <Button
                  type="submit"
                  className="btn-3d-primary w-full"
                  disabled={login.formState.isSubmitting}
                >
                  <LockKeyhole className="size-4" />
                  {login.formState.isSubmitting ? "Connexion…" : "Se connecter"}
                </Button>
                <button
                  type="button"
                  onClick={onForgot}
                  className="w-full text-center text-xs text-muted-foreground transition-colors hover:text-primary"
                >
                  Mot de passe oublié ?
                </button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-6">
              <form onSubmit={signup.handleSubmit(onSignup)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Nom complet</Label>
                  <Input id="signup-name" {...signup.register("fullName")} />
                  {signup.formState.errors.fullName && (
                    <p className="text-xs text-destructive">
                      {signup.formState.errors.fullName.message}
                    </p>
                  )}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input id="signup-email" type="email" {...signup.register("email")} />
                    {signup.formState.errors.email && (
                      <p className="text-xs text-destructive">
                        {signup.formState.errors.email.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-phone">Téléphone</Label>
                    <Input id="signup-phone" placeholder="+243 …" {...signup.register("phone")} />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Mot de passe</Label>
                    <Input id="signup-password" type="password" {...signup.register("password")} />
                    {signup.formState.errors.password && (
                      <p className="text-xs text-destructive">
                        {signup.formState.errors.password.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm">Confirmation</Label>
                    <Input id="signup-confirm" type="password" {...signup.register("confirm")} />
                    {signup.formState.errors.confirm && (
                      <p className="text-xs text-destructive">
                        {signup.formState.errors.confirm.message}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  type="submit"
                  className="btn-3d-primary w-full"
                  disabled={signup.formState.isSubmitting}
                >
                  <User className="size-4" />
                  {signup.formState.isSubmitting ? "Création…" : "Créer mon compte"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="my-6 flex items-center gap-4">
            <span className="h-px flex-1 bg-border" />
            <span className="text-[0.7rem] uppercase tracking-[0.14em] text-muted-foreground">
              ou
            </span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <Button variant="outline" className="w-full" onClick={onGoogle} disabled={googleLoading}>
            <Mail className="size-4" />
            {googleLoading ? "Ouverture…" : "Continuer avec Google"}
          </Button>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            En continuant, vous acceptez nos{" "}
            <Link to="/" className="underline underline-offset-4 hover:text-primary">
              conditions d'utilisation
            </Link>
            .
          </p>
        </motion.div>
      </div>
    </section>
  );
}
