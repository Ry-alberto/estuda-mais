import { Tarefa } from "../../domain/entities/tarefa";
import { NaoEncontradoError } from "../../domain/errors/domain.error";
import { DisciplinaRepository } from "../../domain/repositories/disciplina.repository";
import { TarefaRepository } from "../../domain/repositories/tarefa.repository";

// A task belongs to the user who owns its subject.
export async function buscarTarefaDoUsuario(
  tarefas: TarefaRepository,
  disciplinas: DisciplinaRepository,
  id: string,
  usuarioId: string,
): Promise<Tarefa> {
  const tarefa = await tarefas.buscarPorId(id);
  if (!tarefa) throw new NaoEncontradoError("Tarefa");
  const disciplina = await disciplinas.buscarPorId(tarefa.disciplinaId);
  if (!disciplina || !disciplina.pertenceA(usuarioId)) throw new NaoEncontradoError("Tarefa");
  return tarefa;
}
