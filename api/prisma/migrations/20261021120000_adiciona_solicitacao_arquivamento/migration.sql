ALTER TABLE "Animal"
ADD COLUMN "arquivado" BOOLEAN NOT NULL DEFAULT false;

CREATE TYPE "StatusSolicitacaoArquivamento" AS ENUM ('PENDENTE', 'APROVADA', 'RECUSADA');

CREATE TABLE "SolicitacaoArquivamento" (
    "id" SERIAL NOT NULL,
    "descricao" TEXT NOT NULL,
    "resposta" TEXT,
    "status" "StatusSolicitacaoArquivamento" NOT NULL DEFAULT 'PENDENTE',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "animalId" INTEGER NOT NULL,
    "solicitanteId" INTEGER NOT NULL,
    "adminId" INTEGER,
    CONSTRAINT "SolicitacaoArquivamento_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SolicitacaoArquivamento_animalId_idx" ON "SolicitacaoArquivamento" ("animalId");

CREATE INDEX "SolicitacaoArquivamento_solicitanteId_idx" ON "SolicitacaoArquivamento" ("solicitanteId");

CREATE INDEX "SolicitacaoArquivamento_status_idx" ON "SolicitacaoArquivamento" ("status");

ALTER TABLE "SolicitacaoArquivamento"
ADD CONSTRAINT "SolicitacaoArquivamento_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SolicitacaoArquivamento"
ADD CONSTRAINT "SolicitacaoArquivamento_solicitanteId_fkey" FOREIGN KEY ("solicitanteId") REFERENCES "Cliente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "SolicitacaoArquivamento"
ADD CONSTRAINT "SolicitacaoArquivamento_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin" ("id") ON DELETE SET NULL ON UPDATE CASCADE;