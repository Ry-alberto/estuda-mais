import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { definirAoExpirarSessao, definirToken } from "@/lib/api";
import { lerStorage, removerStorage, salvarStorage } from "@/lib/storage";
import { authService, type Sessao, type Usuario } from "./auth.service";

const CHAVE_SESSAO = "estuda:sessao";

interface AuthContextValue {
  usuario: Usuario | null;
  entrar: (email: string, senha: string) => Promise<void>;
  cadastrar: (nome: string, email: string, senha: string) => Promise<void>;
  sair: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Reads the saved session synchronously so the token is already set before
// the first protected request fires (avoids a redirect flash on reload).
function sessaoInicial(): Sessao | null {
  const sessao = lerStorage<Sessao | null>(CHAVE_SESSAO, null);
  definirToken(sessao?.accessToken ?? null);
  return sessao;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sessao, setSessao] = useState<Sessao | null>(sessaoInicial);

  const aplicar = useCallback((nova: Sessao | null) => {
    definirToken(nova?.accessToken ?? null);
    if (nova) salvarStorage(CHAVE_SESSAO, nova);
    else removerStorage(CHAVE_SESSAO);
    setSessao(nova);
  }, []);

  const sair = useCallback(() => aplicar(null), [aplicar]);

  // Any 401 from the API (expired JWT) sends the user back to the login screen.
  useEffect(() => {
    definirAoExpirarSessao(sair);
    return () => definirAoExpirarSessao(null);
  }, [sair]);

  const value = useMemo<AuthContextValue>(
    () => ({
      usuario: sessao?.usuario ?? null,
      entrar: async (email, senha) => aplicar(await authService.login(email, senha)),
      cadastrar: async (nome, email, senha) => aplicar(await authService.registrar(nome, email, senha)),
      sair,
    }),
    [sessao, aplicar, sair],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de <AuthProvider>.");
  return ctx;
}

// Non-null user for pages rendered behind <RotaProtegida>.
export function useUsuario(): Usuario {
  const { usuario } = useAuth();
  if (!usuario) throw new Error("Usuário não autenticado.");
  return usuario;
}
