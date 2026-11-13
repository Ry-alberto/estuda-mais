// End-to-end test of the HTTP layer: real Nest app, real ValidationPipe, real JWT
// guard and real bcrypt; only the database is swapped for in-memory repositories,
// so it runs in CI without PostgreSQL. Covers the endpoints of section 8.4 and RNF02.
import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { App } from "supertest/types";
import { AppModule } from "../../src/app.module";
import { DISCIPLINA_REPOSITORY } from "../../src/domain/repositories/disciplina.repository";
import { TAREFA_REPOSITORY } from "../../src/domain/repositories/tarefa.repository";
import { USUARIO_REPOSITORY } from "../../src/domain/repositories/usuario.repository";
import { PrismaService } from "../../src/infrastructure/prisma/prisma.service";
import { InMemoryDisciplinaRepository, InMemoryTarefaRepository, InMemoryUsuarioRepository } from "../support/in-memory";

describe("API Estuda+ (e2e)", () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    process.env.JWT_SECRET = "segredo-de-teste-com-32-caracteres!";
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({})
      .overrideProvider(USUARIO_REPOSITORY)
      .useValue(new InMemoryUsuarioRepository())
      .overrideProvider(DISCIPLINA_REPOSITORY)
      .useValue(new InMemoryDisciplinaRepository())
      .overrideProvider(TAREFA_REPOSITORY)
      .useValue(new InMemoryTarefaRepository())
      .compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const http = () => request(app.getHttpServer());

  async function cadastrar(email: string): Promise<string> {
    const res = await http().post("/auth/register").send({ nome: "Teste", email, senha: "segredo1" }).expect(201);
    return res.body.accessToken as string;
  }

  it("GET /health é público", async () => {
    await http().get("/health").expect(200, { status: "ok" });
  });

  describe("auth", () => {
    it("cadastra, não expõe o hash e permite login", async () => {
      const res = await http()
        .post("/auth/register")
        .send({ nome: "Ana", email: "ana@e2e.com", senha: "segredo1" })
        .expect(201);
      expect(res.body.accessToken).toEqual(expect.any(String));
      expect(res.body.usuario).toEqual({ id: expect.any(String), nome: "Ana", email: "ana@e2e.com" });

      const login = await http().post("/auth/login").send({ email: "ana@e2e.com", senha: "segredo1" }).expect(200);
      expect(login.body.accessToken).toEqual(expect.any(String));
    });

    it("409 para e-mail repetido e 401 para senha errada", async () => {
      await cadastrar("repetido@e2e.com");
      await http()
        .post("/auth/register")
        .send({ nome: "Outro", email: "repetido@e2e.com", senha: "segredo1" })
        .expect(409);
      await http().post("/auth/login").send({ email: "repetido@e2e.com", senha: "errada" }).expect(401);
    });

    it("400 com mensagem para dados inválidos", async () => {
      const res = await http().post("/auth/register").send({ nome: "", email: "x", senha: "1" }).expect(400);
      expect(res.body.message).toEqual(
        expect.arrayContaining(["Informe seu nome.", "Informe um e-mail válido."]),
      );
    });
  });

  describe("rotas protegidas (RNF02)", () => {
    it.each(["/disciplinas", "/tarefas"])("GET %s sem token responde 401", async (rota) => {
      await http().get(rota).expect(401);
    });

    it("token adulterado responde 401", async () => {
      const token = await cadastrar("adulterado@e2e.com");
      await http().get("/disciplinas").set("Authorization", `Bearer ${token}x`).expect(401);
      await http().get("/disciplinas").set("Authorization", token).expect(401);
    });
  });

  describe("fluxo de disciplinas e tarefas", () => {
    it("CRUD completo, filtros e isolamento entre usuários", async () => {
      const ana = await cadastrar("fluxo-ana@e2e.com");
      const bia = await cadastrar("fluxo-bia@e2e.com");
      const comoAna = (req: request.Test) => req.set("Authorization", `Bearer ${ana}`);
      const comoBia = (req: request.Test) => req.set("Authorization", `Bearer ${bia}`);

      // Disciplinas
      const web = (await comoAna(http().post("/disciplinas")).send({ nome: "Web 2", professor: "Marcos" }).expect(201))
        .body;
      expect(web).toEqual({ id: expect.any(String), nome: "Web 2", professor: "Marcos", cor: "#5b4bdb" });
      await comoAna(http().post("/disciplinas")).send({ nome: "Hack", usuarioId: "outro" }).expect(400);
      await comoAna(http().patch(`/disciplinas/${web.id}`)).send({ cor: "#2EC4B6" }).expect(200);
      await comoBia(http().patch(`/disciplinas/${web.id}`)).send({ nome: "Invasão" }).expect(404);
      await comoAna(http().patch("/disciplinas/nao-e-uuid")).send({ nome: "x" }).expect(400);
      expect((await comoBia(http().get("/disciplinas")).expect(200)).body).toEqual([]);

      // Tarefas
      const tarefa = (
        await comoAna(http().post("/tarefas"))
          .send({ titulo: "Prova P1", prazo: "2026-11-20", disciplinaId: web.id, tipo: "PROVA", prioridade: "ALTA" })
          .expect(201)
      ).body;
      expect(tarefa).toMatchObject({ titulo: "Prova P1", prazo: "2026-11-20", status: "PENDENTE", tipo: "PROVA" });
      await comoAna(http().post("/tarefas"))
        .send({ titulo: "Entrega", prazo: "2026-11-25", disciplinaId: web.id })
        .expect(201);
      await comoAna(http().post("/tarefas"))
        .send({ titulo: "Data ruim", prazo: "2026-02-30", disciplinaId: web.id })
        .expect(400);
      await comoBia(http().post("/tarefas"))
        .send({ titulo: "Invasão", prazo: "2026-11-20", disciplinaId: web.id })
        .expect(404);

      await comoAna(http().patch(`/tarefas/${tarefa.id}`)).send({ status: "CONCLUIDA" }).expect(200);
      await comoAna(http().patch(`/tarefas/${tarefa.id}`)).send({ status: "FEITA" }).expect(400);
      const concluidas = (await comoAna(http().get("/tarefas?status=CONCLUIDA")).expect(200)).body;
      expect(concluidas.map((t: { titulo: string }) => t.titulo)).toEqual(["Prova P1"]);
      const daWeb = (await comoAna(http().get(`/tarefas?disciplinaId=${web.id}`)).expect(200)).body;
      expect(daWeb).toHaveLength(2);
      expect((await comoBia(http().get("/tarefas")).expect(200)).body).toEqual([]);

      await comoBia(http().delete(`/tarefas/${tarefa.id}`)).expect(404);
      await comoAna(http().delete(`/tarefas/${tarefa.id}`)).expect(204);
      await comoAna(http().delete(`/disciplinas/${web.id}`)).expect(204);
      expect((await comoAna(http().get("/disciplinas")).expect(200)).body).toEqual([]);
    });
  });
});
