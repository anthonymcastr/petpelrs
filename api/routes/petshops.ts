import { PrismaClient } from "@prisma/client"
import { Router } from "express"

const prisma = new PrismaClient()
const router = Router()

// Só devolve serviços ativos, em ordem alfabética
const includeServicos = {
  servicos: {
    where: { ativo: true },
    orderBy: { nome: "asc" as const },
  },
}

// ========================
// GET - LISTA DE PETSHOPS ATIVAS
// ========================
router.get("/", async (req, res) => {
  try {
    const petshops = await prisma.petshop.findMany({
      where: { ativo: true },
      include: includeServicos,
      orderBy: { nome: "asc" },
    })
    res.status(200).json(petshops)
  } catch (error) {
    console.error(error)
    res.status(500).json({ erro: "Erro ao buscar petshops" })
  }
})

// ========================
// GET - PETSHOP POR ID
// ========================
router.get("/:id", async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) {
    return res.status(400).json({ erro: "Identificador inválido" })
  }

  try {
    const petshop = await prisma.petshop.findFirst({
      where: { id, ativo: true },
      include: includeServicos,
    })

    if (!petshop) {
      return res.status(404).json({ erro: "Petshop não encontrada" })
    }

    res.status(200).json(petshop)
  } catch (error) {
    console.error(error)
    res.status(500).json({ erro: "Erro ao buscar petshop" })
  }
})

export default router