import { api } from "@/lib/api";

export interface Usuario {
  id: string;
  nome: string;
  email: string;
}

export interface Sessao {
  accessToken: string;
  usuario: Usuario;
}

// RF01 endpoints (section 8.4): both return a JWT, so signing up also logs in.
export const authService = {
  registrar: (nome: string, email: string, senha: string) =>
    api<Sessao>("/auth/register", { method: "POST", body: { nome, email, senha } }),
  login: (email: string, senha: string) => api<Sessao>("/auth/login", { method: "POST", body: { email, senha } }),
};
