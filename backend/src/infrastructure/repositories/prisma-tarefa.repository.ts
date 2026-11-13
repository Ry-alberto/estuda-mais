import { Injectable } from "@nestjs/common";
import { Tarefa as TarefaRow } from "@prisma/client";
import { Tarefa } from "../../domain/entities/tarefa";
import { FiltrosTarefa, TarefaRepository } from "../../domain/repositories/tarefa.repository";
import { PrismaService } from "../prisma/prisma.service";

const paraEntidade = (row: TarefaRow): Tarefa =>
  Tarefa.restaurar({
    id: row.id,
    titulo: row.titulo,
    tipo: row.tipo,
    prazo: row.prazo,
    prioridade: row.prioridade,
    status: row.status,
    disciplinaId: row.disciplinaId,
  });

@Injectable()
export class PrismaTarefaRepository implements TarefaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async salvar(tarefa: Tarefa): Promise<Tarefa> {
    const dados = {
      titulo: tarefa.titulo,
      tipo: tarefa.tipo,
      prazo: tarefa.prazo,
      prioridade: tarefa.prioridade,
      status: tarefa.status,
      disciplinaId: tarefa.disciplinaId,
    };
    const row = await this.prisma.tarefa.upsert({
      where: { id: tarefa.id },
      create: { id: tarefa.id, ...dados },
      update: dados,
    });
    return paraEntidade(row);
  }

  async buscarPorId(id: string): Promise<Tarefa | null> {
    const row = await this.prisma.tarefa.findUnique({ where: { id } });
    return row ? paraEntidade(row) : null;
  }

  async listar(filtros: FiltrosTarefa): Promise<Tarefa[]> {
    const rows = await this.prisma.tarefa.findMany({
      where: {
        disciplinaId: { in: filtros.disciplinaIds },
        ...(filtros.status ? { status: filtros.status } : {}),
      },
      orderBy: [{ prazo: "asc" }, { titulo: "asc" }],
    });
    return rows.map(paraEntidade);
  }

  async excluir(id: string): Promise<void> {
    await this.prisma.tarefa.delete({ where: { id } });
  }
}
