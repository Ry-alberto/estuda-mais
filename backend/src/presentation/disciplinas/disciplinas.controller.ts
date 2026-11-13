import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post } from "@nestjs/common";
import { AtualizarDisciplinaUseCase } from "../../application/disciplinas/atualizar-disciplina.use-case";
import { CriarDisciplinaUseCase } from "../../application/disciplinas/criar-disciplina.use-case";
import { ExcluirDisciplinaUseCase } from "../../application/disciplinas/excluir-disciplina.use-case";
import { ListarDisciplinasUseCase } from "../../application/disciplinas/listar-disciplinas.use-case";
import { Disciplina } from "../../domain/entities/disciplina";
import { UsuarioAtual } from "../common/usuario-atual.decorator";
import { AtualizarDisciplinaDto, CriarDisciplinaDto, DisciplinaResponse } from "./disciplina.dto";

const apresentar = (d: Disciplina): DisciplinaResponse => ({
  id: d.id,
  nome: d.nome,
  professor: d.professor,
  cor: d.cor,
});

// RF02 — every route requires a JWT (global guard) and is scoped to the token's user.
@Controller("disciplinas")
export class DisciplinasController {
  constructor(
    private readonly criarDisciplina: CriarDisciplinaUseCase,
    private readonly listarDisciplinas: ListarDisciplinasUseCase,
    private readonly atualizarDisciplina: AtualizarDisciplinaUseCase,
    private readonly excluirDisciplina: ExcluirDisciplinaUseCase,
  ) {}

  @Get()
  async listar(@UsuarioAtual() usuarioId: string): Promise<DisciplinaResponse[]> {
    return (await this.listarDisciplinas.executar(usuarioId)).map(apresentar);
  }

  @Post()
  async criar(@UsuarioAtual() usuarioId: string, @Body() dto: CriarDisciplinaDto): Promise<DisciplinaResponse> {
    return apresentar(await this.criarDisciplina.executar(usuarioId, dto));
  }

  @Patch(":id")
  async atualizar(
    @UsuarioAtual() usuarioId: string,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: AtualizarDisciplinaDto,
  ): Promise<DisciplinaResponse> {
    return apresentar(await this.atualizarDisciplina.executar(usuarioId, id, dto));
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async excluir(@UsuarioAtual() usuarioId: string, @Param("id", ParseUUIDPipe) id: string): Promise<void> {
    await this.excluirDisciplina.executar(usuarioId, id);
  }
}
