import { Module } from "@nestjs/common";
import { AtualizarDisciplinaUseCase } from "../../application/disciplinas/atualizar-disciplina.use-case";
import { CriarDisciplinaUseCase } from "../../application/disciplinas/criar-disciplina.use-case";
import { ExcluirDisciplinaUseCase } from "../../application/disciplinas/excluir-disciplina.use-case";
import { ListarDisciplinasUseCase } from "../../application/disciplinas/listar-disciplinas.use-case";
import { DisciplinasController } from "./disciplinas.controller";

@Module({
  controllers: [DisciplinasController],
  providers: [CriarDisciplinaUseCase, ListarDisciplinasUseCase, AtualizarDisciplinaUseCase, ExcluirDisciplinaUseCase],
})
export class DisciplinasModule {}
