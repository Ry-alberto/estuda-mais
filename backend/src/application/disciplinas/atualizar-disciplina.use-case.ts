import { Inject, Injectable } from "@nestjs/common";
import { Disciplina } from "../../domain/entities/disciplina";
import { DISCIPLINA_REPOSITORY, DisciplinaRepository } from "../../domain/repositories/disciplina.repository";
import { buscarDisciplinaDoUsuario } from "./buscar-disciplina-do-usuario";

export interface AtualizarDisciplinaDados {
  nome?: string;
  professor?: string | null;
  cor?: string;
}

@Injectable()
export class AtualizarDisciplinaUseCase {
  constructor(@Inject(DISCIPLINA_REPOSITORY) private readonly disciplinas: DisciplinaRepository) {}

  async executar(usuarioId: string, id: string, dados: AtualizarDisciplinaDados): Promise<Disciplina> {
    const disciplina = await buscarDisciplinaDoUsuario(this.disciplinas, id, usuarioId);
    disciplina.atualizar(dados);
    return this.disciplinas.salvar(disciplina);
  }
}
