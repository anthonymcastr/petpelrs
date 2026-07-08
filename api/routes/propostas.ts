import { PrismaClient } from "@prisma/client"
import { Router } from "express"
import { z } from "zod"
import { enviarEmail } from "../utils/email"
import { gerarCodigoConversa } from "../utils/gerarCodigoConversa"

const prisma = new PrismaClient()
const router = Router()

// =====================
// Schema de validação
// =====================
const contatoSchema = z.object({
  mensagem: z.string().min(2),
  remetenteId: z.number(),
  destinatarioId: z.number(),
  animalId: z.number(),
})

// =====================
// 🧠 GERADOR DE CÓDIGO (SÓ VISUAL / APRESENTAÇÃO)
// =====================


// =====================
// 📤 ENVIAR MENSAGEM
// =====================
router.post("/", async (req, res) => {
  const valida = contatoSchema.safeParse(req.body)

  if (!valida.success) {
    return res.status(400).json({ erros: valida.error.errors })
  }

  const { mensagem, remetenteId, destinatarioId, animalId } = valida.data

  try {
    // ❌ não pode falar consigo mesmo
    if (remetenteId === destinatarioId) {
      return res
        .status(400)
        .json({ erro: "Você não pode conversar consigo mesmo" })
    }

    // 🔎 valida animal
    const animal = await prisma.animal.findUnique({
      where: { id: animalId },
      include: {
        usuario: {
          select: { id: true, email: true, nome: true },
        },
      },
    })

    if (!animal) {
      return res.status(404).json({ erro: "Animal não encontrado" })
    }

    // 🧠 reaproveita a conversa já existente entre os mesmos usuários e animal
    const conversaExistente = await prisma.contato.findFirst({
      where: {
        animalId,
        OR: [
          {
            remetenteId,
            destinatarioId,
          },
          {
            remetenteId: destinatarioId,
            destinatarioId: remetenteId,
          },
        ],
      },
      orderBy: {
        criadoEm: "desc",
      },
      select: {
        codigoConversa: true,
      },
    })

    const codigoConversa = conversaExistente?.codigoConversa ?? gerarCodigoConversa()

    // ✅ cria mensagem
    const contato = await prisma.contato.create({
      data: {
        mensagem,
        animalId,
        remetenteId,
        destinatarioId,
        codigoConversa,
      },
      include: {
        animal: true,
        remetente: true,
        destinatario: true,
      },
    })

    // 📧 EMAIL NOTIFICAÇÃO
    if (
      animal.usuario?.email &&
      animal.usuario.id === destinatarioId
    ) {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          
          <h2 style="color:#1e3a8a;">
            📩 Nova mensagem sobre ${animal.nome}
          </h2>

          <p>Você recebeu uma nova mensagem sobre seu pet:</p>

          <div style="background:#f3f4f6;padding:15px;border-radius:8px;">
            "${mensagem}"
          </div>

          <p>
            <strong>De:</strong> ${contato.remetente.nome}
          </p>

          <p style="margin-top:20px;">
            <a href="https://www.petpelrs.com.br/inbox"
               style="background:#1e3a8a;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">
              Ver conversa
            </a>
          </p>

          <p style="margin-top:20px;font-size:12px;color:#6b7280;">
            Código da conversa (demo): ${codigoConversa}
          </p>

        </div>
      `

      try {
        await enviarEmail(
          animal.usuario.email,
          `📩 Nova mensagem sobre ${animal.nome}`,
          html
        )
      } catch (err) {
        console.warn("Erro ao enviar e-mail:", err)
      }
    }

    return res.status(201).json(contato)
  } catch (error) {
    console.error("ERRO POST CONTATO:", error)
    return res.status(500).json({
      erro: "Erro ao enviar mensagem",
    })
  }
})

// =====================
// 📥 INBOX
// =====================
router.get("/inbox/:usuarioId", async (req, res) => {
  const usuarioId = Number(req.params.usuarioId)

  if (!usuarioId) {
    return res.status(400).json({ erro: "usuarioId inválido" })
  }

  try {
    const mensagens = await prisma.contato.findMany({
      where: {
        OR: [
          { remetenteId: usuarioId },
          { destinatarioId: usuarioId },
        ],
      },
      include: {
        animal: true,
        remetente: true,
        destinatario: true,
      },
      orderBy: {
        criadoEm: "asc",
      },
    })

    return res.json(mensagens)
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      erro: "Erro ao carregar inbox",
    })
  }
})

// =====================
// 📊 NÃO LIDAS
// =====================
router.get("/nao-lidas/:usuarioId", async (req, res) => {
  const usuarioId = Number(req.params.usuarioId)

  if (!usuarioId) {
    return res.status(400).json({ erro: "usuarioId inválido" })
  }

  try {
    const count = await prisma.contato.count({
      where: {
        destinatarioId: usuarioId,
        lida: false,
      },
    })

    return res.json({ naoLidas: count })
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      erro: "Erro ao contar mensagens",
    })
  }
})

// =====================
// ✅ MARCAR COMO LIDAS
// =====================
router.patch("/marcar-lidas", async (req, res) => {
  const { usuarioId, animalId, outroUsuarioId } = req.body

  if (!usuarioId || !animalId || !outroUsuarioId) {
    return res.status(400).json({
      erro: "Dados incompletos",
    })
  }

  try {
    await prisma.contato.updateMany({
      where: {
        animalId: Number(animalId),
        destinatarioId: Number(usuarioId),
        remetenteId: Number(outroUsuarioId),
        lida: false,
      },
      data: {
        lida: true,
      },
    })

    return res.json({ sucesso: true })
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      erro: "Erro ao marcar mensagens como lidas",
    })
  }
})

// =====================
// 📄 CONTATOS POR CLIENTE
// =====================
router.get("/:clienteId", async (req, res) => {
  const clienteId = Number(req.params.clienteId)

  if (!clienteId) {
    return res.status(400).json({ erro: "clienteId inválido" })
  }

  try {
    const contatos = await prisma.contato.findMany({
      where: {
        OR: [
          { remetenteId: clienteId },
          { destinatarioId: clienteId },
        ],
      },
      include: {
        animal: true,
        remetente: true,
        destinatario: true,
      },
      orderBy: {
        criadoEm: "desc",
      },
    })

    const lista = contatos.map((contato) => ({
      id: contato.id,
      mensagem: contato.mensagem,
      resposta: null,
      criadoEm: contato.criadoEm,
      animal: contato.animal,
      cliente:
        contato.remetenteId === clienteId
          ? contato.destinatario
          : contato.remetente,
      remetente: contato.remetente,
      destinatario: contato.destinatario,
    }))

    return res.json(lista)
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      erro: "Erro ao carregar contatos",
    })
  }
})

export default router