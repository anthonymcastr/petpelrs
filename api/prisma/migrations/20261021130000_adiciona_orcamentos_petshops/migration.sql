ALTER TABLE "Petshop" ADD COLUMN "email" TEXT;

CREATE TYPE "StatusOrcamento" AS ENUM ('PENDENTE', 'RESPONDIDO');

CREATE TABLE "Orcamento" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "observacao" TEXT,
    "servicosJson" TEXT NOT NULL,
    "totalEstimado" DOUBLE PRECISION,
    "resposta" TEXT,
    "status" "StatusOrcamento" NOT NULL DEFAULT 'PENDENTE',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "petshopId" INTEGER NOT NULL,
    "clienteId" INTEGER NOT NULL,

    CONSTRAINT "Orcamento_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Orcamento_token_key" ON "Orcamento"("token");
CREATE INDEX "Orcamento_petshopId_idx" ON "Orcamento"("petshopId");
CREATE INDEX "Orcamento_clienteId_idx" ON "Orcamento"("clienteId");
CREATE INDEX "Orcamento_status_idx" ON "Orcamento"("status");

ALTER TABLE "Orcamento" ADD CONSTRAINT "Orcamento_petshopId_fkey" FOREIGN KEY ("petshopId") REFERENCES "Petshop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Orcamento" ADD CONSTRAINT "Orcamento_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;