import { IsIn, IsNotEmpty, IsOptional, IsString, IsUUID, Matches, MaxLength } from "class-validator";
import {
  PRIORIDADES,
  Prioridade,
  STATUS_TAREFA,
  StatusTarefa,
  TIPOS_TAREFA,
  TipoTarefa,
} from "../../domain/entities/tarefa";

const PRAZO_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const PRAZO_MENSAGEM = "Prazo inválido: use o formato AAAA-MM-DD.";

export class CriarTarefaDto {
  @IsString()
  @IsNotEmpty({ message: "Informe o título da tarefa." })
  @MaxLength(80)
  titulo: string;

  @Matches(PRAZO_REGEX, { message: PRAZO_MENSAGEM })
  prazo: string;

  @IsUUID("4", { message: "Disciplina inválida." })
  disciplinaId: string;

  @IsOptional()
  @IsIn(TIPOS_TAREFA)
  tipo?: TipoTarefa;

  @IsOptional()
  @IsIn(PRIORIDADES)
  prioridade?: Prioridade;

  @IsOptional()
  @IsIn(STATUS_TAREFA)
  status?: StatusTarefa;
}

export class AtualizarTarefaDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: "Informe o título da tarefa." })
  @MaxLength(80)
  titulo?: string;

  @IsOptional()
  @Matches(PRAZO_REGEX, { message: PRAZO_MENSAGEM })
  prazo?: string;

  @IsOptional()
  @IsUUID("4", { message: "Disciplina inválida." })
  disciplinaId?: string;

  @IsOptional()
  @IsIn(TIPOS_TAREFA)
  tipo?: TipoTarefa;

  @IsOptional()
  @IsIn(PRIORIDADES)
  prioridade?: Prioridade;

  @IsOptional()
  @IsIn(STATUS_TAREFA)
  status?: StatusTarefa;
}

// Query string filters for GET /tarefas (US03: filter by subject and status).
export class ListarTarefasQuery {
  @IsOptional()
  @IsUUID("4", { message: "Disciplina inválida." })
  disciplinaId?: string;

  @IsOptional()
  @IsIn(STATUS_TAREFA)
  status?: StatusTarefa;
}

export interface TarefaResponse {
  id: string;
  titulo: string;
  tipo: TipoTarefa;
  prazo: string; // YYYY-MM-DD
  prioridade: Prioridade;
  status: StatusTarefa;
  disciplinaId: string;
}
