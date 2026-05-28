import { Router } from "express"
import bcrypt from "bcrypt"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()
const router = Router()

router.post("/", async (req, res) => {
  try {
    const { email, senha } = req.body

    if (!email || !senha) {
      return res.status(400).json({
        erro: "Email e senha obrigatórios"
      })
    }

    const admin = await prisma.admin.findUnique({
      where: { email }
    })

    if (!admin) {
      return res.status(401).json({
        erro: "Administrador não encontrado"
      })
    }

    const senhaValida = await bcrypt.compare(
      senha,
      admin.senha
    )

    if (!senhaValida) {
      return res.status(401).json({
        erro: "Senha incorreta"
      })
    }

    return res.status(200).json({
      id: admin.id,
      nome: admin.nome,
      email: admin.email,
      role: admin.role
    })

  } catch (error) {
    console.error(error)

    return res.status(500).json({
      erro: "Erro ao realizar login admin"
    })
  }
})

export default router