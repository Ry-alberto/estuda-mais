import { createParamDecorator, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { RequestAutenticada } from "./request-autenticada";

// Injects the authenticated user's id (JWT "sub") into a controller parameter.
export const UsuarioAtual = createParamDecorator((_data: unknown, context: ExecutionContext): string => {
  const request = context.switchToHttp().getRequest<RequestAutenticada>();
  if (!request.usuario) throw new UnauthorizedException();
  return request.usuario.sub;
});
