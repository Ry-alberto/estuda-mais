import { Disciplina } from "../entities/disciplina";

export const DISCIPLINA_REPOSITORY = "DisciplinaRepository";

export interface DisciplinaRepository {
  // Insert or update (upsert by id).
  salvar(disciplina: Disciplina): Promise<Disciplina>;
  buscarPorId(id: string): Promise<Disciplina | null>;
  listarPorUsuario(usuarioId: string): Promise<Disciplina[]>;
  // Deleting a subject also deletes its tasks (ON DELETE CASCADE in the database).
  excluir(id: string): Promise<void>;
}
