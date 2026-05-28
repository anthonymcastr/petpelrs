import { Router } from "express"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()
const router = Router()

import bcrypt from "bcrypt"


router.post("/cadastro", async (req, res) => {
  try {
    const { nome, email, senha } = req.body

    if (!nome || !email || !senha) {
      return res.status(400).json({
        erro: "Nome, email e senha são obrigatórios"
      })
    }

    const adminExistente = await prisma.admin.findUnique({
      where: { email }
    })

    if (adminExistente) {
      return res.status(400).json({
        erro: "Administrador já cadastrado"
      })
    }

    const senhaHash = await bcrypt.hash(senha, 10)

    const admin = await prisma.admin.create({
      data: {
        nome,
        email,
        senha: senhaHash,
        role: "admin"
      }
    })

    return res.status(201).json({
      id: admin.id,
      nome: admin.nome,
      email: admin.email,
      role: admin.role
    })

  } catch (error) {
    console.error(error)

    return res.status(500).json({
      erro: "Erro ao cadastrar administrador"
    })
  }
})

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