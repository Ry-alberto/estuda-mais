export const PASSWORD_HASHER = "PasswordHasher";

// Abstraction over bcrypt so use cases stay testable without real hashing cost.
export interface PasswordHasher {
  gerarHash(senha: string): Promise<string>;
  comparar(senha: string, hash: string): Promise<boolean>;
}
