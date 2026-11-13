import { randomUUID } from "node:crypto";
import { ValidacaoError } from "../errors/domain.error";

export interface DisciplinaProps {
  id: string;
  nome: string;
  professor: string | null;
  cor: string;
  usuarioId: string;
}

export const COR_PADRAO = "#5b4bdb";
const COR_REGEX = /^#[0-9a-fA-F]{6}$/;
const NOME_MAX = 60;

export class Disciplina {
  private constructor(private readonly props: DisciplinaProps) {}

  static criar(dados: {
    nome: string;
    professor?: string | null;
    cor?: string | null;
    usuarioId: string;
  }): Disciplina {
    return new Disciplina({
      id: randomUUID(),
      nome: Disciplina.validarNome(dados.nome),
      professor: Disciplina.normalizarProfessor(dados.professor),
      cor: Disciplina.validarCor(dados.cor ?? COR_PADRAO),
      usuarioId: dados.usuarioId,
    });
  }

  static restaurar(props: DisciplinaProps): Disciplina {
    return new Disciplina({ ...props });
  }

  renomear(nome: string): void {
    this.props.nome = Disciplina.validarNome(nome);
  }

  atualizar(patch: { nome?: string; professor?: string | null; cor?: string }): void {
    if (patch.nome !== undefined) this.renomear(patch.nome);
    if (patch.professor !== undefined) this.props.professor = Disciplina.normalizarProfessor(patch.professor);
    if (patch.cor !== undefined) this.props.cor = Disciplina.validarCor(patch.cor);
  }

  // Ownership rule used by every use case: a user only sees their own subjects (US02).
  pertenceA(usuarioId: string): boolean {
    return this.props.usuarioId === usuarioId;
  }

  private static validarNome(nome: string): string {
    const limpo = nome.trim();
    if (!limpo) throw new ValidacaoError("Informe o nome da disciplina.");
    if (limpo.length > NOME_MAX) throw new ValidacaoError(`O nome pode ter no máximo ${NOME_MAX} caracteres.`);
    return limpo;
  }

  private static validarCor(cor: string): string {
    if (!COR_REGEX.test(cor)) throw new ValidacaoError("Cor inválida: use o formato #RRGGBB.");
    return cor.toLowerCase();
  }

  private static normalizarProfessor(professor: string | null | undefined): string | null {
    const limpo = professor?.trim();
    return limpo ? limpo : null;
  }

  get id(): string {
    return this.props.id;
  }
  get nome(): string {
    return this.props.nome;
  }
  get professor(): string | null {
    return this.props.professor;
  }
  get cor(): string {
    return this.props.cor;
  }
  get usuarioId(): string {
    return this.props.usuarioId;
  }
}
