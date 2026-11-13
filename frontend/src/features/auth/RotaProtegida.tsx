import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";

// Client-side guard for UX only; the real protection is the JWT guard on the API.
export function RotaProtegida({ children }: { children: ReactNode }) {
  const { usuario } = useAuth();
  const location = useLocation();
  if (!usuario) return <Navigate to="/login" replace state={{ de: location.pathname }} />;
  return <>{children}</>;
}
