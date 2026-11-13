import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { TokenPayload, TokenService } from "../../domain/services/token-service";

@Injectable()
export class JwtTokenService implements TokenService {
  constructor(private readonly jwt: JwtService) {}

  gerar(payload: TokenPayload): Promise<string> {
    return this.jwt.signAsync({ sub: payload.sub, email: payload.email });
  }

  async verificar(token: string): Promise<TokenPayload | null> {
    try {
      const decoded = await this.jwt.verifyAsync<Partial<TokenPayload>>(token);
      if (typeof decoded.sub !== "string" || typeof decoded.email !== "string") return null;
      return { sub: decoded.sub, email: decoded.email };
    } catch {
      // Expired, bad signature or malformed: all mean "not authenticated".
      return null;
    }
  }
}
