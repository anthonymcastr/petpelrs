import { PrismaClient } from "@prisma/client";
import { Router } from "express";

const prisma = new PrismaClient();
const router = Router();

// 🔒 LISTA CONTATOS PARA A TELA ADMIN
router.get("/", async (req, res) => {
  try {
    const contatos = await prisma.contato.findMany({
      distinct: ["codigoConversa"],
      include: {
        animal: true,
        remetente: true,
        destinatario: true,
      },
      orderBy: {
        criadoEm: "desc",
      },
    });

    const lista = contatos.map((contato) => ({
      id: contato.id,
      codigoConversa: contato.codigoConversa,
      mensagem: contato.mensagem,
      resposta: null,
      criadoEm: contato.criadoEm,
      animal: contato.animal,
      cliente: contato.remetente,
      remetente: contato.remetente,
      destinatario: contato.destinatario,
    }));

    res.json(lista);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro ao buscar conversas" });
  }
});

// 🔐 BUSCAR MENSAGENS SÓ COM CÓDIGO (ADMIN LIBERADO)
router.post("/validar-codigo", async (req, res) => {
  const { codigo } = req.body;

  if (!codigo) {
    return res.status(400).json({ erro: "Código obrigatório" });
  }

  try {
    const mensagens = await prisma.contato.findMany({
      where: { codigoConversa: codigo },
      include: {
        animal: true,
        remetente: true,
        destinatario: true,
      },
      orderBy: {
        criadoEm: "asc",
      },
    });

    if (mensagens.length === 0) {
      return res.status(404).json({ erro: "Conversa não encontrada" });
    }

    res.json(mensagens);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro ao validar código" });
  }
});

export default router;