import { Disciplina } from "../../domain/entities/disciplina";
import { NaoEncontradoError } from "../../domain/errors/domain.error";
import { DisciplinaRepository } from "../../domain/repositories/disciplina.repository";

// Shared ownership check. Another user's subject answers "not found" (404)
// instead of "forbidden", so ids from other accounts are not confirmed to exist.
export async function buscarDisciplinaDoUsuario(
  disciplinas: DisciplinaRepository,
  id: string,
  usuarioId: string,
): Promise<Disciplina> {
  const disciplina = await disciplinas.buscarPorId(id);
  if (!disciplina || !disciplina.pertenceA(usuarioId)) throw new NaoEncontradoError("Disciplina");
  return disciplina;
}
