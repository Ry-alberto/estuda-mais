export const TOKEN_SERVICE = "TokenService";

export interface TokenPayload {
  sub: string; // user id
  email: string;
}

// Abstraction over JWT: login issues tokens, the auth guard verifies them.
export interface TokenService {
  gerar(payload: TokenPayload): Promise<string>;
  // Returns null for a missing, malformed, tampered or expired token.
  verificar(token: string): Promise<TokenPayload | null>;
}
