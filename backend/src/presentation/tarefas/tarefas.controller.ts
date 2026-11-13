import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { AtualizarTarefaUseCase } from "../../application/tarefas/atualizar-tarefa.use-case";
import { CriarTarefaUseCase } from "../../application/tarefas/criar-tarefa.use-case";
import { ExcluirTarefaUseCase } from "../../application/tarefas/excluir-tarefa.use-case";
import { ListarTarefasUseCase } from "../../application/tarefas/listar-tarefas.use-case";
import { Tarefa } from "../../domain/entities/tarefa";
import { UsuarioAtual } from "../common/usuario-atual.decorator";
import { AtualizarTarefaDto, CriarTarefaDto, ListarTarefasQuery, TarefaResponse } from "./tarefa.dto";

const apresentar = (t: Tarefa): TarefaResponse => ({
  id: t.id,
  titulo: t.titulo,
  tipo: t.tipo,
  prazo: Tarefa.formatarPrazo(t.prazo),
  prioridade: t.prioridade,
  status: t.status,
  disciplinaId: t.disciplinaId,
});

// RF03 — tasks with deadline, priority and status.
@Controller("tarefas")
export class TarefasController {
  constructor(
    private readonly criarTarefa: CriarTarefaUseCase,
    private readonly listarTarefas: ListarTarefasUseCase,
    private readonly atualizarTarefa: AtualizarTarefaUseCase,
    private readonly excluirTarefa: ExcluirTarefaUseCase,
  ) {}

  @Get()
  async listar(@UsuarioAtual() usuarioId: string, @Query() filtros: ListarTarefasQuery): Promise<TarefaResponse[]> {
    return (await this.listarTarefas.executar(usuarioId, filtros)).map(apresentar);
  }

  @Post()
  async criar(@UsuarioAtual() usuarioId: string, @Body() dto: CriarTarefaDto): Promise<TarefaResponse> {
    return apresentar(await this.criarTarefa.executar(usuarioId, dto));
  }

  @Patch(":id")
  async atualizar(
    @UsuarioAtual() usuarioId: string,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: AtualizarTarefaDto,
  ): Promise<TarefaResponse> {
    return apresentar(await this.atualizarTarefa.executar(usuarioId, id, dto));
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async excluir(@UsuarioAtual() usuarioId: string, @Param("id", ParseUUIDPipe) id: string): Promise<void> {
    await this.excluirTarefa.executar(usuarioId, id);
  }
}
