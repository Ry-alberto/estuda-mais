import { Inject, Injectable } from "@nestjs/common";
import { Disciplina } from "../../domain/entities/disciplina";
import { DISCIPLINA_REPOSITORY, DisciplinaRepository } from "../../domain/repositories/disciplina.repository";

export interface CriarDisciplinaDados {
  nome: string;
  professor?: string | null;
  cor?: string;
}

@Injectable()
export class CriarDisciplinaUseCase {
  constructor(@Inject(DISCIPLINA_REPOSITORY) private readonly disciplinas: DisciplinaRepository) {}

  executar(usuarioId: string, dados: CriarDisciplinaDados): Promise<Disciplina> {
    return this.disciplinas.salvar(Disciplina.criar({ ...dados, usuarioId }));
  }
}
