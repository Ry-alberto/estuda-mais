// Demo data for development and the oral presentation.
// Run with: npx prisma db seed   (inside Docker: docker compose exec backend npx prisma db seed)
// Plain JS on purpose: it runs in the production image, which has no TypeScript tooling.
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";

// Test account for local development only (never use outside Dev).
const DEMO_EMAIL = "aluno@estuda.dev";
const DEMO_SENHA = "estuda123";

const prisma = new PrismaClient();

// Deadline relative to today, as a UTC-midnight Date (matches the DATE column).
function diaRelativo(dias) {
  const hoje = new Date();
  return new Date(Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + dias));
}

async function main() {
  const existente = await prisma.usuario.findUnique({ where: { email: DEMO_EMAIL } });
  if (existente) {
    console.log(`Seed: ${DEMO_EMAIL} já existe, nada a fazer.`);
    return;
  }

  const usuarioId = randomUUID();
  await prisma.usuario.create({
    data: { id: usuarioId, nome: "Aluno Demo", email: DEMO_EMAIL, senhaHash: await bcrypt.hash(DEMO_SENHA, 10) },
  });

  const disciplinas = [
    { nome: "Programação Web 2", professor: "Prof. Marcos", cor: "#5b4bdb" },
    { nome: "Banco de Dados", professor: "Profa. Lúcia", cor: "#2ec4b6" },
    { nome: "Engenharia de Software", professor: "Prof. André", cor: "#f2a33a" },
    { nome: "Estatística", professor: "Profa. Helena", cor: "#d946b0" },
  ].map((d) => ({ id: randomUUID(), usuarioId, ...d }));
  await prisma.disciplina.createMany({ data: disciplinas });

  const [web, bd, es, est] = disciplinas.map((d) => d.id);
  const tarefas = [
    { titulo: "Modelar MER", disciplinaId: bd, prazo: diaRelativo(1), prioridade: "ALTA", status: "PENDENTE", tipo: "ENTREGA" },
    { titulo: "Entrega da 1ª etapa do projeto", disciplinaId: web, prazo: diaRelativo(2), prioridade: "ALTA", status: "EM_ANDAMENTO", tipo: "ENTREGA" },
    { titulo: "Prova P1", disciplinaId: est, prazo: diaRelativo(6), prioridade: "MEDIA", status: "PENDENTE", tipo: "PROVA" },
    { titulo: "Diagrama de casos de uso", disciplinaId: es, prazo: diaRelativo(9), prioridade: "BAIXA", status: "PENDENTE", tipo: "TAREFA" },
    { titulo: "Prova de Banco de Dados", disciplinaId: bd, prazo: diaRelativo(13), prioridade: "ALTA", status: "PENDENTE", tipo: "PROVA" },
    { titulo: "Lista de exercícios SQL", disciplinaId: bd, prazo: diaRelativo(-1), prioridade: "MEDIA", status: "CONCLUIDA", tipo: "TAREFA" },
  ].map((t) => ({ id: randomUUID(), ...t }));
  await prisma.tarefa.createMany({ data: tarefas });

  console.log(`Seed: conta demo criada (${DEMO_EMAIL}).`);
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
