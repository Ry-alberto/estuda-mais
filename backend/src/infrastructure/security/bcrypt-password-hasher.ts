import { Injectable } from "@nestjs/common";
import { compare, hash } from "bcryptjs";
import { PasswordHasher } from "../../domain/services/password-hasher";

// bcrypt cost factor: 10 rounds ≈ tens of ms per hash. Slow enough to make
// brute force expensive, fast enough to keep login under the 500 ms target (RNF03).
const SALT_ROUNDS = 10;

// bcryptjs is a pure-JS bcrypt (same algorithm and hash format), chosen so the
// Docker image needs no native build tools.
@Injectable()
export class BcryptPasswordHasher implements PasswordHasher {
  gerarHash(senha: string): Promise<string> {
    return hash(senha, SALT_ROUNDS);
  }

  comparar(senha: string, senhaHash: string): Promise<boolean> {
    return compare(senha, senhaHash);
  }
}
