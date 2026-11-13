import { Inject, Injectable } from "@nestjs/common";
import { DISCIPLINA_REPOSITORY, DisciplinaRepository } from "../../domain/repositories/disciplina.repository";
import { buscarDisciplinaDoUsuario } from "./buscar-disciplina-do-usuario";

@Injectable()
export class ExcluirDisciplinaUseCase {
  constructor(@Inject(DISCIPLINA_REPOSITORY) private readonly disciplinas: DisciplinaRepository) {}

  async executar(usuarioId: string, id: string): Promise<void> {
    await buscarDisciplinaDoUsuario(this.disciplinas, id, usuarioId);
    await this.disciplinas.excluir(id);
  }
}
