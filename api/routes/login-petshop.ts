import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
import { PrismaClient } from "@prisma/client"
import { Router } from "express"

const prisma = new PrismaClient()
const router = Router()

router.post("/", async (req, res) => {
  const { email, senha } = req.body
  if (!email || !senha) return res.status(400).json({ erro: "E-mail e senha obrigatórios" })

  try {
    const petshop = await prisma.petshop.findFirst({ where: { email, ativo: true } })
    if (!petshop?.senha || !(await bcrypt.compare(senha, petshop.senha))) return res.status(401).json({ erro: "E-mail ou senha incorretos" })

    const token = jwt.sign({ id: petshop.id, role: "petshop" }, process.env.JWT_SECRET || process.env.JWT_KEY || "segredo", { expiresIn: "8h" })
    res.json({ id: petshop.id, nome: petshop.nome, email: petshop.email, role: "petshop", token })
  } catch (error) {
    console.error(error)
    res.status(500).json({ erro: "Erro ao realizar login da petshop" })
  }
})

export default router