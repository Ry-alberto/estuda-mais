import { AtualizarDisciplinaUseCase } from "../../../src/application/disciplinas/atualizar-disciplina.use-case";
import { CriarDisciplinaUseCase } from "../../../src/application/disciplinas/criar-disciplina.use-case";
import { ExcluirDisciplinaUseCase } from "../../../src/application/disciplinas/excluir-disciplina.use-case";
import { ListarDisciplinasUseCase } from "../../../src/application/disciplinas/listar-disciplinas.use-case";
import { AtualizarTarefaUseCase } from "../../../src/application/tarefas/atualizar-tarefa.use-case";
import { CriarTarefaUseCase } from "../../../src/application/tarefas/criar-tarefa.use-case";
import { ExcluirTarefaUseCase } from "../../../src/application/tarefas/excluir-tarefa.use-case";
import { ListarTarefasUseCase } from "../../../src/application/tarefas/listar-tarefas.use-case";
import { NaoEncontradoError } from "../../../src/domain/errors/domain.error";
import { InMemoryDisciplinaRepository, InMemoryTarefaRepository } from "../../support/in-memory";

const ANA = "usuario-ana";
const BIA = "usuario-bia";

describe("Disciplinas (RF02) e Tarefas (RF03)", () => {
  let disciplinas: InMemoryDisciplinaRepository;
  let tarefas: InMemoryTarefaRepository;

  beforeEach(() => {
    disciplinas = new InMemoryDisciplinaRepository();
    tarefas = new InMemoryTarefaRepository();
  });

  const criarDisciplina = (usuarioId: string, nome: string) =>
    new CriarDisciplinaUseCase(disciplinas).executar(usuarioId, { nome });
  const criarTarefa = (usuarioId: string, disciplinaId: string, titulo: string, prazo: string) =>
    new CriarTarefaUseCase(tarefas, disciplinas).executar(usuarioId, { titulo, prazo, disciplinaId });

  describe("Disciplinas", () => {
    it("cada usuário lista só as suas disciplinas, em ordem alfabética", async () => {
      await criarDisciplina(ANA, "Web 2");
      await criarDisciplina(ANA, "Banco de Dados");
      await criarDisciplina(BIA, "Estatística");

      const daAna = await new ListarDisciplinasUseCase(disciplinas).executar(ANA);
      expect(daAna.map((d) => d.nome)).toEqual(["Banco de Dados", "Web 2"]);
    });

    it("edita a própria disciplina", async () => {
      const web = await criarDisciplina(ANA, "Web 2");
      const editada = await new AtualizarDisciplinaUseCase(disciplinas).executar(ANA, web.id, {
        nome: "Web II",
        professor: "Marcos",
      });
      expect(editada.nome).toBe("Web II");
      expect(editada.professor).toBe("Marcos");
    });

    it("não deixa editar nem excluir disciplina de outro usuário", async () => {
      const web = await criarDisciplina(ANA, "Web 2");
      await expect(new AtualizarDisciplinaUseCase(disciplinas).executar(BIA, web.id, { nome: "x" })).rejects.toThrow(
        NaoEncontradoError,
      );
      await expect(new ExcluirDisciplinaUseCase(disciplinas).executar(BIA, web.id)).rejects.toThrow(NaoEncontradoError);
      expect(disciplinas.itens.has(web.id)).toBe(true);
    });

    it("exclui a própria disciplina", async () => {
      const web = await criarDisciplina(ANA, "Web 2");
      await new ExcluirDisciplinaUseCase(disciplinas).executar(ANA, web.id);
      expect(disciplinas.itens.size).toBe(0);
    });

    it("responde 'não encontrada' para id inexistente", async () => {
      await expect(new ExcluirDisciplinaUseCase(disciplinas).executar(ANA, "nao-existe")).rejects.toThrow(
        NaoEncontradoError,
      );
    });
  });

  describe("Tarefas", () => {
    it("cria tarefa só em disciplina própria", async () => {
      const web = await criarDisciplina(ANA, "Web 2");
      const tarefa = await criarTarefa(ANA, web.id, "Entrega 1", "2026-11-20");
      expect(tarefa.status).toBe("PENDENTE");
      await expect(criarTarefa(BIA, web.id, "Invasão", "2026-11-20")).rejects.toThrow(NaoEncontradoError);
    });

    it("lista por prazo e filtra por disciplina e status (US03)", async () => {
      const web = await criarDisciplina(ANA, "Web 2");
      const bd = await criarDisciplina(ANA, "Banco de Dados");
      const outraConta = await criarDisciplina(BIA, "Estatística");
      await criarTarefa(ANA, web.id, "Depois", "2026-11-30");
      const antes = await criarTarefa(ANA, web.id, "Antes", "2026-11-14");
      await criarTarefa(ANA, bd.id, "MER", "2026-11-20");
      await criarTarefa(BIA, outraConta.id, "Da Bia", "2026-11-13");
      await new AtualizarTarefaUseCase(tarefas, disciplinas).executar(ANA, antes.id, { status: "CONCLUIDA" });

      const listar = new ListarTarefasUseCase(tarefas, disciplinas);
      expect((await listar.executar(ANA)).map((t) => t.titulo)).toEqual(["Antes", "MER", "Depois"]);
      expect((await listar.executar(ANA, { disciplinaId: web.id })).map((t) => t.titulo)).toEqual(["Antes", "Depois"]);
      expect((await listar.executar(ANA, { status: "CONCLUIDA" })).map((t) => t.titulo)).toEqual(["Antes"]);
      // Filtering by someone else's subject returns nothing instead of leaking data.
      expect(await listar.executar(ANA, { disciplinaId: outraConta.id })).toEqual([]);
    });

    it("usuário sem disciplinas recebe lista vazia", async () => {
      expect(await new ListarTarefasUseCase(tarefas, disciplinas).executar(ANA)).toEqual([]);
    });

    it("muda status, edita e move para outra disciplina própria", async () => {
      const web = await criarDisciplina(ANA, "Web 2");
      const bd = await criarDisciplina(ANA, "Banco de Dados");
      const tarefa = await criarTarefa(ANA, web.id, "Entrega 1", "2026-11-20");
      const atualizar = new AtualizarTarefaUseCase(tarefas, disciplinas);

      const editada = await atualizar.executar(ANA, tarefa.id, { status: "EM_ANDAMENTO", disciplinaId: bd.id });
      expect(editada.status).toBe("EM_ANDAMENTO");
      expect(editada.disciplinaId).toBe(bd.id);
    });

    it("não move tarefa para disciplina de outro usuário", async () => {
      const web = await criarDisciplina(ANA, "Web 2");
      const daBia = await criarDisciplina(BIA, "Estatística");
      const tarefa = await criarTarefa(ANA, web.id, "Entrega 1", "2026-11-20");
      await expect(
        new AtualizarTarefaUseCase(tarefas, disciplinas).executar(ANA, tarefa.id, { disciplinaId: daBia.id }),
      ).rejects.toThrow(NaoEncontradoError);
    });

    it("não deixa outro usuário editar ou excluir a tarefa", async () => {
      const web = await criarDisciplina(ANA, "Web 2");
      const tarefa = await criarTarefa(ANA, web.id, "Entrega 1", "2026-11-20");
      await expect(
        new AtualizarTarefaUseCase(tarefas, disciplinas).executar(BIA, tarefa.id, { titulo: "x" }),
      ).rejects.toThrow(NaoEncontradoError);
      await expect(new ExcluirTarefaUseCase(tarefas, disciplinas).executar(BIA, tarefa.id)).rejects.toThrow(
        NaoEncontradoError,
      );
    });

    it("exclui a própria tarefa e responde 404 para tarefa inexistente", async () => {
      const web = await criarDisciplina(ANA, "Web 2");
      const tarefa = await criarTarefa(ANA, web.id, "Entrega 1", "2026-11-20");
      const excluir = new ExcluirTarefaUseCase(tarefas, disciplinas);
      await excluir.executar(ANA, tarefa.id);
      expect(tarefas.itens.size).toBe(0);
      await expect(excluir.executar(ANA, tarefa.id)).rejects.toThrow(NaoEncontradoError);
    });
  });
});
