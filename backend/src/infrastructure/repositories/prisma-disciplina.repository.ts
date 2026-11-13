import { Injectable } from "@nestjs/common";
import { Disciplina as DisciplinaRow } from "@prisma/client";
import { Disciplina } from "../../domain/entities/disciplina";
import { DisciplinaRepository } from "../../domain/repositories/disciplina.repository";
import { PrismaService } from "../prisma/prisma.service";

const paraEntidade = (row: DisciplinaRow): Disciplina =>
  Disciplina.restaurar({
    id: row.id,
    nome: row.nome,
    professor: row.professor,
    cor: row.cor,
    usuarioId: row.usuarioId,
  });

@Injectable()
export class PrismaDisciplinaRepository implements DisciplinaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async salvar(disciplina: Disciplina): Promise<Disciplina> {
    const dados = { nome: disciplina.nome, professor: disciplina.professor, cor: disciplina.cor };
    const row = await this.prisma.disciplina.upsert({
      where: { id: disciplina.id },
      create: { id: disciplina.id, usuarioId: disciplina.usuarioId, ...dados },
      update: dados,
    });
    return paraEntidade(row);
  }

  async buscarPorId(id: string): Promise<Disciplina | null> {
    const row = await this.prisma.disciplina.findUnique({ where: { id } });
    return row ? paraEntidade(row) : null;
  }

  async listarPorUsuario(usuarioId: string): Promise<Disciplina[]> {
    const rows = await this.prisma.disciplina.findMany({ where: { usuarioId }, orderBy: { nome: "asc" } });
    return rows.map(paraEntidade);
  }

  async excluir(id: string): Promise<void> {
    await this.prisma.disciplina.delete({ where: { id } });
  }
}
