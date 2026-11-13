import { Disciplina } from "../../../src/domain/entities/disciplina";
import { Tarefa } from "../../../src/domain/entities/tarefa";
import { Usuario } from "../../../src/domain/entities/usuario";
import { ValidacaoError } from "../../../src/domain/errors/domain.error";

describe("Usuario", () => {
  it("normaliza o e-mail e remove espaços do nome", () => {
    const usuario = Usuario.criar({ nome: "  Ana  ", email: " Ana@Mail.COM ", senhaHash: "h" });
    expect(usuario.nome).toBe("Ana");
    expect(usuario.email).toBe("ana@mail.com");
    expect(usuario.id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("rejeita nome vazio e e-mail inválido", () => {
    expect(() => Usuario.criar({ nome: " ", email: "a@b.com", senhaHash: "h" })).toThrow(ValidacaoError);
    expect(() => Usuario.criar({ nome: "Ana", email: "sem-arroba", senhaHash: "h" })).toThrow(ValidacaoError);
  });
});

describe("Disciplina", () => {
  const base = { nome: "Web 2", usuarioId: "u1" };

  it("usa a cor padrão e guarda professor vazio como null", () => {
    const disciplina = Disciplina.criar({ ...base, professor: "   " });
    expect(disciplina.cor).toBe("#5b4bdb");
    expect(disciplina.professor).toBeNull();
  });

  it("renomeia e atualiza campos parcialmente", () => {
    const disciplina = Disciplina.criar({ ...base, professor: "Marcos", cor: "#2EC4B6" });
    expect(disciplina.cor).toBe("#2ec4b6");
    disciplina.atualizar({ nome: "Web II" });
    expect(disciplina.nome).toBe("Web II");
    expect(disciplina.professor).toBe("Marcos");
    disciplina.atualizar({ professor: null, cor: "#000000" });
    expect(disciplina.professor).toBeNull();
    expect(disciplina.cor).toBe("#000000");
  });

  it("valida nome e cor", () => {
    expect(() => Disciplina.criar({ ...base, nome: "" })).toThrow(ValidacaoError);
    expect(() => Disciplina.criar({ ...base, nome: "x".repeat(61) })).toThrow(ValidacaoError);
    expect(() => Disciplina.criar({ ...base, cor: "roxo" })).toThrow(ValidacaoError);
  });

  it("sabe a quem pertence", () => {
    const disciplina = Disciplina.criar(base);
    expect(disciplina.pertenceA("u1")).toBe(true);
    expect(disciplina.pertenceA("u2")).toBe(false);
  });
});

describe("Tarefa", () => {
  const base = { titulo: "Prova P1", prazo: "2026-11-20", disciplinaId: "d1" };

  it("aplica os valores padrão do diagrama de classes", () => {
    const tarefa = Tarefa.criar(base);
    expect(tarefa.tipo).toBe("TAREFA");
    expect(tarefa.prioridade).toBe("MEDIA");
    expect(tarefa.status).toBe("PENDENTE");
    expect(Tarefa.formatarPrazo(tarefa.prazo)).toBe("2026-11-20");
  });

  it("rejeita prazo em formato errado ou data inexistente", () => {
    expect(() => Tarefa.criar({ ...base, prazo: "20/11/2026" })).toThrow(ValidacaoError);
    expect(() => Tarefa.criar({ ...base, prazo: "2026-02-30" })).toThrow(ValidacaoError);
  });

  it("valida o título", () => {
    expect(() => Tarefa.criar({ ...base, titulo: "  " })).toThrow(ValidacaoError);
    expect(() => Tarefa.criar({ ...base, titulo: "x".repeat(81) })).toThrow(ValidacaoError);
  });

  it("atualiza campos e conclui", () => {
    const tarefa = Tarefa.criar(base);
    tarefa.atualizar({ titulo: "Prova P2", prazo: "2026-12-01", tipo: "PROVA", prioridade: "ALTA", status: "EM_ANDAMENTO", disciplinaId: "d2" });
    expect(tarefa.titulo).toBe("Prova P2");
    expect(tarefa.tipo).toBe("PROVA");
    expect(tarefa.prioridade).toBe("ALTA");
    expect(tarefa.status).toBe("EM_ANDAMENTO");
    expect(tarefa.disciplinaId).toBe("d2");
    tarefa.concluir();
    expect(tarefa.status).toBe("CONCLUIDA");
  });

  it("estaProximaDoPrazo: até 3 dias ou atrasada, ignorando concluídas", () => {
    const hoje = new Date(2026, 10, 12); // 12/11/2026, local time
    expect(Tarefa.criar({ ...base, prazo: "2026-11-15" }).estaProximaDoPrazo(hoje)).toBe(true);
    expect(Tarefa.criar({ ...base, prazo: "2026-11-10" }).estaProximaDoPrazo(hoje)).toBe(true);
    expect(Tarefa.criar({ ...base, prazo: "2026-11-16" }).estaProximaDoPrazo(hoje)).toBe(false);
    expect(Tarefa.criar({ ...base, prazo: "2026-11-13", status: "CONCLUIDA" }).estaProximaDoPrazo(hoje)).toBe(false);
  });
});
