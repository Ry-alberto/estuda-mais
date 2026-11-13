import { StatusTarefa, Tarefa } from "../entities/tarefa";

export const TAREFA_REPOSITORY = "TarefaRepository";

export interface FiltrosTarefa {
  // Restricts the search to these subjects; the use case passes the user's own subjects.
  disciplinaIds: string[];
  status?: StatusTarefa;
}

export interface TarefaRepository {
  salvar(tarefa: Tarefa): Promise<Tarefa>;
  buscarPorId(id: string): Promise<Tarefa | null>;
  // Sorted by deadline (closest first).
  listar(filtros: FiltrosTarefa): Promise<Tarefa[]>;
  excluir(id: string): Promise<void>;
}
