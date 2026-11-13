import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { TOKEN_SERVICE, TokenService } from "../../domain/services/token-service";
import { ROTA_PUBLICA } from "./publico.decorator";
import { RequestAutenticada } from "./request-autenticada";

// Runs before every controller (APP_GUARD). Flow:
// public route? -> allow; otherwise read "Authorization: Bearer <jwt>" -> verify
// -> attach the payload to the request -> controller reads it via @UsuarioAtual().
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(TOKEN_SERVICE) private readonly tokens: TokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const publica = this.reflector.getAllAndOverride<boolean | undefined>(ROTA_PUBLICA, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (publica) return true;

    const request = context.switchToHttp().getRequest<RequestAutenticada>();
    const [tipo, token] = (request.headers.authorization ?? "").split(" ");
    if (tipo !== "Bearer" || !token) throw new UnauthorizedException("Token de acesso ausente.");

    const payload = await this.tokens.verificar(token);
    if (!payload) throw new UnauthorizedException("Token inválido ou expirado.");

    request.usuario = payload;
    return true;
  }
}
