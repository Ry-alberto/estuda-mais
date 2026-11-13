// Domain errors carry no HTTP knowledge; the presentation layer
// (DomainExceptionFilter) translates each one into a status code.
export abstract class DomainError extends Error {
  protected constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidacaoError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}

export class NaoEncontradoError extends DomainError {
  constructor(recurso: string) {
    super(`${recurso} não encontrado(a).`);
  }
}

export class ConflitoError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}

export class CredenciaisInvalidasError extends DomainError {
  constructor() {
    super("E-mail ou senha inválidos.");
  }
}
