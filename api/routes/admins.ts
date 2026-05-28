import { Router } from "express"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()
const router = Router()

router.get("/", async (req, res) => {
  try {

    const totalClientes = await prisma.cliente.count()
    const totalAnimais = await prisma.animal.count()
    const totalContatos = await prisma.contato.count()

    return res.status(200).json({
      totalClientes,
      totalAnimais,
      totalContatos
    })

  } catch (error) {
    console.error(error)

    return res.status(500).json({
      erro: "Erro ao buscar dados admin"
    })
  }
})

export default router