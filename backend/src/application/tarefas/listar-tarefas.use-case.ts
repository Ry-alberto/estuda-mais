import { Inject, Injectable } from "@nestjs/common";
import { StatusTarefa, Tarefa } from "../../domain/entities/tarefa";
import { DISCIPLINA_REPOSITORY, DisciplinaRepository } from "../../domain/repositories/disciplina.repository";
import { TAREFA_REPOSITORY, TarefaRepository } from "../../domain/repositories/tarefa.repository";

export interface FiltrosListagem {
  disciplinaId?: string;
  status?: StatusTarefa;
}

@Injectable()
export class ListarTarefasUseCase {
  constructor(
    @Inject(TAREFA_REPOSITORY) private readonly tarefas: TarefaRepository,
    @Inject(DISCIPLINA_REPOSITORY) private readonly disciplinas: DisciplinaRepository,
  ) {}

  // Tasks have no user column (MER: tarefa -> disciplina -> usuario), so the
  // search is scoped to the ids of the user's subjects. A disciplinaId filter
  // that is not one of them simply yields an empty list.
  async executar(usuarioId: string, filtros: FiltrosListagem = {}): Promise<Tarefa[]> {
    const minhas = (await this.disciplinas.listarPorUsuario(usuarioId)).map((d) => d.id);
    const disciplinaIds = filtros.disciplinaId
      ? minhas.filter((id) => id === filtros.disciplinaId)
      : minhas;
    if (disciplinaIds.length === 0) return [];
    return this.tarefas.listar({ disciplinaIds, status: filtros.status });
  }
}
