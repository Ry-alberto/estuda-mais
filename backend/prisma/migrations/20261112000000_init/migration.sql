-- CreateEnum
CREATE TYPE "TipoTarefa" AS ENUM ('TAREFA', 'PROVA', 'ENTREGA');

-- CreateEnum
CREATE TYPE "Prioridade" AS ENUM ('BAIXA', 'MEDIA', 'ALTA');

-- CreateEnum
CREATE TYPE "StatusTarefa" AS ENUM ('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA');

-- CreateTable
CREATE TABLE "usuario" (
    "id" UUID NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disciplina" (
    "id" UUID NOT NULL,
    "nome" VARCHAR(60) NOT NULL,
    "professor" VARCHAR(60),
    "cor" VARCHAR(7) NOT NULL DEFAULT '#5b4bdb',
    "usuario_id" UUID NOT NULL,

    CONSTRAINT "disciplina_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tarefa" (
    "id" UUID NOT NULL,
    "titulo" VARCHAR(80) NOT NULL,
    "tipo" "TipoTarefa" NOT NULL DEFAULT 'TAREFA',
    "prazo" DATE NOT NULL,
    "prioridade" "Prioridade" NOT NULL DEFAULT 'MEDIA',
    "status" "StatusTarefa" NOT NULL DEFAULT 'PENDENTE',
    "disciplina_id" UUID NOT NULL,

    CONSTRAINT "tarefa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessao_estudo" (
    "id" UUID NOT NULL,
    "inicio" TIMESTAMP(3) NOT NULL,
    "duracao_min" INTEGER NOT NULL,
    "usuario_id" UUID NOT NULL,
    "disciplina_id" UUID NOT NULL,

    CONSTRAINT "sessao_estudo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificacao" (
    "id" UUID NOT NULL,
    "tipo" VARCHAR(40) NOT NULL,
    "mensagem" TEXT NOT NULL,
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "usuario_id" UUID NOT NULL,

    CONSTRAINT "notificacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grupo_estudo" (
    "id" UUID NOT NULL,
    "nome" VARCHAR(50) NOT NULL,
    "codigo_convite" VARCHAR(10) NOT NULL,

    CONSTRAINT "grupo_estudo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membro" (
    "usuario_id" UUID NOT NULL,
    "grupo_id" UUID NOT NULL,
    "entrada_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "membro_pkey" PRIMARY KEY ("usuario_id","grupo_id")
);

-- CreateTable
CREATE TABLE "material" (
    "id" UUID NOT NULL,
    "titulo" VARCHAR(200) NOT NULL,
    "url" TEXT,
    "grupo_id" UUID NOT NULL,

    CONSTRAINT "material_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_key" ON "usuario"("email");

-- CreateIndex
CREATE INDEX "disciplina_usuario_id_idx" ON "disciplina"("usuario_id");

-- CreateIndex
CREATE INDEX "tarefa_disciplina_id_idx" ON "tarefa"("disciplina_id");

-- CreateIndex
CREATE INDEX "sessao_estudo_usuario_id_idx" ON "sessao_estudo"("usuario_id");

-- CreateIndex
CREATE INDEX "notificacao_usuario_id_idx" ON "notificacao"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "grupo_estudo_codigo_convite_key" ON "grupo_estudo"("codigo_convite");

-- CreateIndex
CREATE INDEX "material_grupo_id_idx" ON "material"("grupo_id");

-- AddForeignKey
ALTER TABLE "disciplina" ADD CONSTRAINT "disciplina_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarefa" ADD CONSTRAINT "tarefa_disciplina_id_fkey" FOREIGN KEY ("disciplina_id") REFERENCES "disciplina"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessao_estudo" ADD CONSTRAINT "sessao_estudo_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessao_estudo" ADD CONSTRAINT "sessao_estudo_disciplina_id_fkey" FOREIGN KEY ("disciplina_id") REFERENCES "disciplina"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacao" ADD CONSTRAINT "notificacao_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membro" ADD CONSTRAINT "membro_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membro" ADD CONSTRAINT "membro_grupo_id_fkey" FOREIGN KEY ("grupo_id") REFERENCES "grupo_estudo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material" ADD CONSTRAINT "material_grupo_id_fkey" FOREIGN KEY ("grupo_id") REFERENCES "grupo_estudo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
