import { useContext } from "react";
import { AuthContext, type AuthContextValue } from "@/providers/AuthProvider";

/** Accès à la session, au profil et aux rôles de l'utilisateur courant. */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit être utilisé à l'intérieur d'un AuthProvider.");
  }
  return context;
}
