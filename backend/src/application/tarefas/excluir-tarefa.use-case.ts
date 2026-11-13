import { Inject, Injectable } from "@nestjs/common";
import { DISCIPLINA_REPOSITORY, DisciplinaRepository } from "../../domain/repositories/disciplina.repository";
import { TAREFA_REPOSITORY, TarefaRepository } from "../../domain/repositories/tarefa.repository";
import { buscarTarefaDoUsuario } from "./buscar-tarefa-do-usuario";

@Injectable()
export class ExcluirTarefaUseCase {
  constructor(
    @Inject(TAREFA_REPOSITORY) private readonly tarefas: TarefaRepository,
    @Inject(DISCIPLINA_REPOSITORY) private readonly disciplinas: DisciplinaRepository,
  ) {}

  async executar(usuarioId: string, id: string): Promise<void> {
    await buscarTarefaDoUsuario(this.tarefas, this.disciplinas, id, usuarioId);
    await this.tarefas.excluir(id);
  }
}
