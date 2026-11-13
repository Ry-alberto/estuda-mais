import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from "@nestjs/common";
import { Response } from "express";
import {
  ConflitoError,
  CredenciaisInvalidasError,
  DomainError,
  NaoEncontradoError,
  ValidacaoError,
} from "../../domain/errors/domain.error";

// Translates domain errors into HTTP responses, keeping the Domain free of HTTP concerns.
// Response body has the same shape as Nest's built-in errors: { statusCode, message, error }.
@Catch(DomainError)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const statusCode = DomainExceptionFilter.status(exception);
    response.status(statusCode).json({ statusCode, message: exception.message, error: exception.name });
  }

  private static status(exception: DomainError): HttpStatus {
    if (exception instanceof ValidacaoError) return HttpStatus.BAD_REQUEST;
    if (exception instanceof CredenciaisInvalidasError) return HttpStatus.UNAUTHORIZED;
    if (exception instanceof NaoEncontradoError) return HttpStatus.NOT_FOUND;
    if (exception instanceof ConflitoError) return HttpStatus.CONFLICT;
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }
}
