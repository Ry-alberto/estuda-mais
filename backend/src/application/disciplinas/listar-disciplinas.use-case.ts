import { Inject, Injectable } from "@nestjs/common";
import { Disciplina } from "../../domain/entities/disciplina";
import { DISCIPLINA_REPOSITORY, DisciplinaRepository } from "../../domain/repositories/disciplina.repository";

@Injectable()
export class ListarDisciplinasUseCase {
  constructor(@Inject(DISCIPLINA_REPOSITORY) private readonly disciplinas: DisciplinaRepository) {}

  executar(usuarioId: string): Promise<Disciplina[]> {
    return this.disciplinas.listarPorUsuario(usuarioId);
  }
}
