import { randomUUID } from "node:crypto";
import { ValidacaoError } from "../errors/domain.error";

export interface UsuarioProps {
  id: string;
  nome: string;
  email: string;
  senhaHash: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class Usuario {
  private constructor(private readonly props: UsuarioProps) {}

  // Factory for new users: validates input and normalizes the e-mail,
  // so "Ana@Mail.com" and "ana@mail.com" are the same account.
  static criar(dados: { nome: string; email: string; senhaHash: string }): Usuario {
    const nome = dados.nome.trim();
    const email = Usuario.normalizarEmail(dados.email);
    if (!nome) throw new ValidacaoError("Informe seu nome.");
    if (!EMAIL_REGEX.test(email)) throw new ValidacaoError("Informe um e-mail válido.");
    return new Usuario({ id: randomUUID(), nome, email, senhaHash: dados.senhaHash });
  }

  // Rebuilds an entity that already exists in the database (no validation, no new id).
  static restaurar(props: UsuarioProps): Usuario {
    return new Usuario({ ...props });
  }

  static normalizarEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  get id(): string {
    return this.props.id;
  }
  get nome(): string {
    return this.props.nome;
  }
  get email(): string {
    return this.props.email;
  }
  get senhaHash(): string {
    return this.props.senhaHash;
  }
}
