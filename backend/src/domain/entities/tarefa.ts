import { randomUUID } from "node:crypto";
import { ValidacaoError } from "../errors/domain.error";

export const TIPOS_TAREFA = ["TAREFA", "PROVA", "ENTREGA"] as const;
export const PRIORIDADES = ["BAIXA", "MEDIA", "ALTA"] as const;
export const STATUS_TAREFA = ["PENDENTE", "EM_ANDAMENTO", "CONCLUIDA"] as const;

export type TipoTarefa = (typeof TIPOS_TAREFA)[number];
export type Prioridade = (typeof PRIORIDADES)[number];
export type StatusTarefa = (typeof STATUS_TAREFA)[number];

export interface TarefaProps {
  id: string;
  titulo: string;
  tipo: TipoTarefa;
  // Calendar day stored as UTC midnight (PostgreSQL DATE column), so the
  // deadline never shifts by one day because of the server time zone.
  prazo: Date;
  prioridade: Prioridade;
  status: StatusTarefa;
  disciplinaId: string;
}

const TITULO_MAX = 80;
const PRAZO_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const DIA_MS = 86_400_000;

export class Tarefa {
  private constructor(private readonly props: TarefaProps) {}

  static criar(dados: {
    titulo: string;
    prazo: string;
    disciplinaId: string;
    tipo?: TipoTarefa;
    prioridade?: Prioridade;
    status?: StatusTarefa;
  }): Tarefa {
    return new Tarefa({
      id: randomUUID(),
      titulo: Tarefa.validarTitulo(dados.titulo),
      prazo: Tarefa.parsePrazo(dados.prazo),
      tipo: dados.tipo ?? "TAREFA",
      prioridade: dados.prioridade ?? "MEDIA",
      status: dados.status ?? "PENDENTE",
      disciplinaId: dados.disciplinaId,
    });
  }

  static restaurar(props: TarefaProps): Tarefa {
    return new Tarefa({ ...props });
  }

  // "YYYY-MM-DD" -> Date at UTC midnight. Rejects impossible dates such as 2026-02-30.
  static parsePrazo(valor: string): Date {
    if (!PRAZO_REGEX.test(valor)) throw new ValidacaoError("Prazo inválido: use o formato AAAA-MM-DD.");
    const data = new Date(`${valor}T00:00:00.000Z`);
    if (Number.isNaN(data.getTime()) || Tarefa.formatarPrazo(data) !== valor) {
      throw new ValidacaoError("Prazo inválido: data inexistente.");
    }
    return data;
  }

  static formatarPrazo(data: Date): string {
    return data.toISOString().slice(0, 10);
  }

  atualizar(patch: {
    titulo?: string;
    prazo?: string;
    tipo?: TipoTarefa;
    prioridade?: Prioridade;
    status?: StatusTarefa;
    disciplinaId?: string;
  }): void {
    if (patch.titulo !== undefined) this.props.titulo = Tarefa.validarTitulo(patch.titulo);
    if (patch.prazo !== undefined) this.props.prazo = Tarefa.parsePrazo(patch.prazo);
    if (patch.tipo !== undefined) this.props.tipo = patch.tipo;
    if (patch.prioridade !== undefined) this.props.prioridade = patch.prioridade;
    if (patch.status !== undefined) this.props.status = patch.status;
    if (patch.disciplinaId !== undefined) this.props.disciplinaId = patch.disciplinaId;
  }

  concluir(): void {
    this.props.status = "CONCLUIDA";
  }

  // Basis for RF08 (deadline notifications): open task due within `dias` days, or overdue.
  estaProximaDoPrazo(hoje: Date = new Date(), dias = 3): boolean {
    if (this.props.status === "CONCLUIDA") return false;
    const hojeUtc = Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    const diferencaDias = Math.round((this.props.prazo.getTime() - hojeUtc) / DIA_MS);
    return diferencaDias <= dias;
  }

  private static validarTitulo(titulo: string): string {
    const limpo = titulo.trim();
    if (!limpo) throw new ValidacaoError("Informe o título da tarefa.");
    if (limpo.length > TITULO_MAX) throw new ValidacaoError(`O título pode ter no máximo ${TITULO_MAX} caracteres.`);
    return limpo;
  }

  get id(): string {
    return this.props.id;
  }
  get titulo(): string {
    return this.props.titulo;
  }
  get tipo(): TipoTarefa {
    return this.props.tipo;
  }
  get prazo(): Date {
    return this.props.prazo;
  }
  get prioridade(): Prioridade {
    return this.props.prioridade;
  }
  get status(): StatusTarefa {
    return this.props.status;
  }
  get disciplinaId(): string {
    return this.props.disciplinaId;
  }
}
