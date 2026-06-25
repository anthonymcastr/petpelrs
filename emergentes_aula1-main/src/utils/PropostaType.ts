import type { AnimalType } from "../utils/animalType"

export type PropostaType = {
  id: number
  clienteId: string
  animalId: number
  animal: AnimalType
  descricao: string
  resposta: string | null
  createdAt: string
  updatedAt: string | null
}