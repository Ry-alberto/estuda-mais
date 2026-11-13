// In-memory implementations of the domain interfaces. Because use cases depend
// only on the interfaces, these replace Prisma/bcrypt/JWT in tests (Liskov, section 10.2).
import { Disciplina } from "../../src/domain/entities/disciplina";
import { Tarefa } from "../../src/domain/entities/tarefa";
import { Usuario } from "../../src/domain/entities/usuario";
import { DisciplinaRepository } from "../../src/domain/repositories/disciplina.repository";
import { FiltrosTarefa, TarefaRepository } from "../../src/domain/repositories/tarefa.repository";
import { UsuarioRepository } from "../../src/domain/repositories/usuario.repository";
import { PasswordHasher } from "../../src/domain/services/password-hasher";
import { TokenPayload, TokenService } from "../../src/domain/services/token-service";

export class InMemoryUsuarioRepository implements UsuarioRepository {
  readonly itens = new Map<string, Usuario>();

  async buscarPorEmail(email: string): Promise<Usuario | null> {
    return [...this.itens.values()].find((u) => u.email === email) ?? null;
  }

  async salvar(usuario: Usuario): Promise<Usuario> {
    this.itens.set(usuario.id, usuario);
    return usuario;
  }
}

export class InMemoryDisciplinaRepository implements DisciplinaRepository {
  readonly itens = new Map<string, Disciplina>();

  async salvar(disciplina: Disciplina): Promise<Disciplina> {
    this.itens.set(disciplina.id, disciplina);
    return disciplina;
  }

  async buscarPorId(id: string): Promise<Disciplina | null> {
    return this.itens.get(id) ?? null;
  }

  async listarPorUsuario(usuarioId: string): Promise<Disciplina[]> {
    return [...this.itens.values()]
      .filter((d) => d.usuarioId === usuarioId)
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }

  async excluir(id: string): Promise<void> {
    this.itens.delete(id);
  }
}

export class InMemoryTarefaRepository implements TarefaRepository {
  readonly itens = new Map<string, Tarefa>();

  async salvar(tarefa: Tarefa): Promise<Tarefa> {
    this.itens.set(tarefa.id, tarefa);
    return tarefa;
  }

  async buscarPorId(id: string): Promise<Tarefa | null> {
    return this.itens.get(id) ?? null;
  }

  async listar(filtros: FiltrosTarefa): Promise<Tarefa[]> {
    return [...this.itens.values()]
      .filter((t) => filtros.disciplinaIds.includes(t.disciplinaId))
      .filter((t) => !filtros.status || t.status === filtros.status)
      .sort((a, b) => a.prazo.getTime() - b.prazo.getTime());
  }

  async excluir(id: string): Promise<void> {
    this.itens.delete(id);
  }
}

// Reversible "hash" so unit tests run instantly; the e2e test uses real bcrypt.
export class FakePasswordHasher implements PasswordHasher {
  async gerarHash(senha: string): Promise<string> {
    return `hash:${senha}`;
  }

  async comparar(senha: string, hash: string): Promise<boolean> {
    return hash === `hash:${senha}`;
  }
}

export class FakeTokenService implements TokenService {
  async gerar(payload: TokenPayload): Promise<string> {
    return `token:${payload.sub}:${payload.email}`;
  }

  async verificar(token: string): Promise<TokenPayload | null> {
    const [prefixo, sub, email] = token.split(":");
    return prefixo === "token" && sub && email ? { sub, email } : null;
  }
}
