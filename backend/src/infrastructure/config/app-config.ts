// Reads and validates environment variables once at startup (Dev/Prod via .env, section 9).
// Failing fast here beats discovering a missing secret on the first login request.
export interface AppConfig {
  port: number;
  jwtSecret: string;
  jwtExpiresInSeconds: number;
  corsOrigins: string[];
}

export const APP_CONFIG = "AppConfig";

const JWT_SECRET_MIN = 16;
const UM_DIA_SEGUNDOS = 86_400;

export function carregarConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const jwtSecret = env.JWT_SECRET ?? "";
  if (jwtSecret.length < JWT_SECRET_MIN) {
    throw new Error(`JWT_SECRET precisa ter pelo menos ${JWT_SECRET_MIN} caracteres.`);
  }

  const port = Number(env.PORT ?? 3000);
  const jwtExpiresInSeconds = Number(env.JWT_EXPIRES_IN_SECONDS ?? UM_DIA_SEGUNDOS);
  if (!Number.isInteger(port) || port <= 0) throw new Error("PORT inválida.");
  if (!Number.isInteger(jwtExpiresInSeconds) || jwtExpiresInSeconds <= 0) {
    throw new Error("JWT_EXPIRES_IN_SECONDS inválido.");
  }

  const corsOrigins = (env.CORS_ORIGIN ?? "http://localhost:5173")
    .split(",")
    .map((origem) => origem.trim())
    .filter(Boolean);

  return { port, jwtSecret, jwtExpiresInSeconds, corsOrigins };
}
