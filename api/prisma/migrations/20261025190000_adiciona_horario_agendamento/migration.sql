ALTER TABLE "Orcamento"
ADD COLUMN "dataAgendamento" TEXT,
ADD COLUMN "horarioAgendamento" TEXT;

CREATE UNIQUE INDEX "Orcamento_petshopId_dataAgendamento_horarioAgendamento_key"
ON "Orcamento" ("petshopId", "dataAgendamento", "horarioAgendamento");
