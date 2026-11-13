// HTTP client for the NestJS API (REST + JSON + JWT, section 8.2).
// Every feature service goes through `api()`, so auth headers, error
// parsing and the "session expired" handling live in one place.

const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:3000").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

let tokenAtual: string | null = null;
let aoExpirarSessao: (() => void) | null = null;

export function definirToken(token: string | null): void {
  tokenAtual = token;
}

// AuthProvider registers a callback that logs the user out when a protected call returns 401.
export function definirAoExpirarSessao(callback: (() => void) | null): void {
  aoExpirarSessao = callback;
}

type Query = Record<string, string | undefined>;

interface Opcoes {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Query;
}

function montarUrl(caminho: string, query?: Query): string {
  const url = new URL(`${API_URL}${caminho}`);
  Object.entries(query ?? {}).forEach(([chave, valor]) => {
    if (valor) url.searchParams.set(chave, valor);
  });
  return url.toString();
}

// Nest errors look like { statusCode, message: string | string[], error }.
function extrairMensagem(corpo: unknown, status: number): string {
  if (corpo && typeof corpo === "object" && "message" in corpo) {
    const { message } = corpo as { message: unknown };
    if (Array.isArray(message)) return message.join(" ");
    if (typeof message === "string") return message;
  }
  return status >= 500 ? "Erro no servidor. Tente novamente." : `Erro ${status}.`;
}

export async function api<T>(caminho: string, opcoes: Opcoes = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (opcoes.body !== undefined) headers["Content-Type"] = "application/json";
  if (tokenAtual) headers.Authorization = `Bearer ${tokenAtual}`;

  let resposta: Response;
  try {
    resposta = await fetch(montarUrl(caminho, opcoes.query), {
      method: opcoes.method ?? "GET",
      headers,
      body: opcoes.body !== undefined ? JSON.stringify(opcoes.body) : undefined,
    });
  } catch {
    throw new ApiError("Não foi possível conectar à API. Verifique se o back-end está rodando.", 0);
  }

  if (resposta.status === 204) return undefined as T;
  const corpo: unknown = await resposta.json().catch(() => null);

  if (!resposta.ok) {
    // 401 on a call made with a token = expired/invalid session.
    if (resposta.status === 401 && tokenAtual) aoExpirarSessao?.();
    throw new ApiError(extrairMensagem(corpo, resposta.status), resposta.status);
  }
  return corpo as T;
}

export function mensagemDeErro(erro: unknown): string {
  return erro instanceof Error ? erro.message : "Algo deu errado.";
}
