import { Inject, Injectable } from "@nestjs/common";
import { Prioridade, StatusTarefa, Tarefa, TipoTarefa } from "../../domain/entities/tarefa";
import { DISCIPLINA_REPOSITORY, DisciplinaRepository } from "../../domain/repositories/disciplina.repository";
import { TAREFA_REPOSITORY, TarefaRepository } from "../../domain/repositories/tarefa.repository";
import { buscarDisciplinaDoUsuario } from "../disciplinas/buscar-disciplina-do-usuario";

export interface CriarTarefaDados {
  titulo: string;
  prazo: string;
  disciplinaId: string;
  tipo?: TipoTarefa;
  prioridade?: Prioridade;
  status?: StatusTarefa;
}

@Injectable()
export class CriarTarefaUseCase {
  constructor(
    @Inject(TAREFA_REPOSITORY) private readonly tarefas: TarefaRepository,
    @Inject(DISCIPLINA_REPOSITORY) private readonly disciplinas: DisciplinaRepository,
  ) {}

  async executar(usuarioId: string, dados: CriarTarefaDados): Promise<Tarefa> {
    // A task can only be attached to one of the user's own subjects.
    await buscarDisciplinaDoUsuario(this.disciplinas, dados.disciplinaId, usuarioId);
    const tarefa = Tarefa.criar(dados); // validation rules live in the Domain
    return this.tarefas.salvar(tarefa);
  }
}
