import { Inject, Injectable } from "@nestjs/common";
import { Prioridade, StatusTarefa, Tarefa, TipoTarefa } from "../../domain/entities/tarefa";
import { DISCIPLINA_REPOSITORY, DisciplinaRepository } from "../../domain/repositories/disciplina.repository";
import { TAREFA_REPOSITORY, TarefaRepository } from "../../domain/repositories/tarefa.repository";
import { buscarDisciplinaDoUsuario } from "../disciplinas/buscar-disciplina-do-usuario";
import { buscarTarefaDoUsuario } from "./buscar-tarefa-do-usuario";

export interface AtualizarTarefaDados {
  titulo?: string;
  prazo?: string;
  tipo?: TipoTarefa;
  prioridade?: Prioridade;
  status?: StatusTarefa;
  disciplinaId?: string;
}

// Covers both "edit" and "change status" (PATCH /tarefas/:id, section 8.4).
@Injectable()
export class AtualizarTarefaUseCase {
  constructor(
    @Inject(TAREFA_REPOSITORY) private readonly tarefas: TarefaRepository,
    @Inject(DISCIPLINA_REPOSITORY) private readonly disciplinas: DisciplinaRepository,
  ) {}

  async executar(usuarioId: string, id: string, dados: AtualizarTarefaDados): Promise<Tarefa> {
    const tarefa = await buscarTarefaDoUsuario(this.tarefas, this.disciplinas, id, usuarioId);
    // Moving the task to another subject: the target must also be the user's.
    if (dados.disciplinaId !== undefined && dados.disciplinaId !== tarefa.disciplinaId) {
      await buscarDisciplinaDoUsuario(this.disciplinas, dados.disciplinaId, usuarioId);
    }
    tarefa.atualizar(dados);
    return this.tarefas.salvar(tarefa);
  }
}
