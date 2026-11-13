import { Injectable } from "@nestjs/common";
import { Usuario as UsuarioRow } from "@prisma/client";
import { Usuario } from "../../domain/entities/usuario";
import { UsuarioRepository } from "../../domain/repositories/usuario.repository";
import { PrismaService } from "../prisma/prisma.service";

const paraEntidade = (row: UsuarioRow): Usuario =>
  Usuario.restaurar({ id: row.id, nome: row.nome, email: row.email, senhaHash: row.senhaHash });

@Injectable()
export class PrismaUsuarioRepository implements UsuarioRepository {
  constructor(private readonly prisma: PrismaService) {}

  async buscarPorEmail(email: string): Promise<Usuario | null> {
    const row = await this.prisma.usuario.findUnique({ where: { email } });
    return row ? paraEntidade(row) : null;
  }

  async salvar(usuario: Usuario): Promise<Usuario> {
    const dados = { nome: usuario.nome, email: usuario.email, senhaHash: usuario.senhaHash };
    const row = await this.prisma.usuario.upsert({
      where: { id: usuario.id },
      create: { id: usuario.id, ...dados },
      update: dados,
    });
    return paraEntidade(row);
  }
}
