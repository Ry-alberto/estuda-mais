import { Module } from "@nestjs/common";
import { AtualizarTarefaUseCase } from "../../application/tarefas/atualizar-tarefa.use-case";
import { CriarTarefaUseCase } from "../../application/tarefas/criar-tarefa.use-case";
import { ExcluirTarefaUseCase } from "../../application/tarefas/excluir-tarefa.use-case";
import { ListarTarefasUseCase } from "../../application/tarefas/listar-tarefas.use-case";
import { TarefasController } from "./tarefas.controller";

@Module({
  controllers: [TarefasController],
  providers: [CriarTarefaUseCase, ListarTarefasUseCase, AtualizarTarefaUseCase, ExcluirTarefaUseCase],
})
export class TarefasModule {}
