import crypto from "node:crypto"
import { PrismaClient, StatusOrcamento } from "@prisma/client"
import { Router } from "express"
import { z } from "zod"
import { autentica, AuthRequest } from "../middleware/autentica"
import { enviarEmail } from "../utils/email"

const prisma = new PrismaClient()
const router = Router()

const pedidoSchema = z.object({
  petshopId: z.number().int().positive(),
  servicoIds: z.array(z.number().int().positive()).min(1),
  observacao: z.string().trim().max(300).optional(),
  dataAgendamento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data de agendamento inválida"),
  horarioAgendamento: z.string().regex(/^\d{2}:\d{2}$/, "Horário de agendamento inválido"),
})

const statusSchema = z.object({
  status: z.enum(["SOLICITACAO_ABERTA", "SERVICO_AGENDADO", "FINALIZADO", "CANCELADO"]),
})

const avaliacaoSchema = z.object({
  nota: z.number().int().min(1).max(5),
  comentario: z.string().trim().max(500).optional(),
})

function frontendUrl() {
  return process.env.FRONTEND_URL || "http://localhost:5173"
}

const diasSemana = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"]

function dataLocal(data: string) {
  const [ano, mes, dia] = data.split("-").map(Number)
  return new Date(ano, mes - 1, dia)
}

function horarioEmMinutos(horario: string) {
  const [hora, minuto] = horario.split(":").map(Number)
  return hora * 60 + minuto
}

function lojaAbertaNoHorario(petshop: { diasFuncionamento: string | null; horario: string | null }, data: string, horario: string) {
  const dataEscolhida = dataLocal(data)
  if (Number.isNaN(dataEscolhida.getTime()) || dataEscolhida.getFullYear() !== Number(data.slice(0, 4)) || dataEscolhida.getMonth() + 1 !== Number(data.slice(5, 7)) || dataEscolhida.getDate() !== Number(data.slice(8, 10))) return false
  const dias = (petshop.diasFuncionamento || "").toLocaleLowerCase()
  const dia = diasSemana[dataEscolhida.getDay()]
  const horarioLoja = petshop.horario?.match(/(\d{2}:\d{2}).*?(\d{2}:\d{2})/)
  if (!dias.includes(dia) || !horarioLoja) return false
  const inicio = horarioEmMinutos(horarioLoja[1])
  const fim = horarioEmMinutos(horarioLoja[2])
  const escolhido = horarioEmMinutos(horario)
  return /^\d{2}:\d{2}$/.test(horario) && escolhido >= inicio && escolhido < fim && escolhido % 60 === 0
}

function gerarDisponibilidade(petshop: { diasFuncionamento: string | null; horario: string | null }, ocupados: Set<string>) {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const resultado: Array<{ data: string; horarios: string[] }> = []
  for (let indice = 0; indice < 60; indice += 1) {
    const data = new Date(hoje)
    data.setDate(hoje.getDate() + indice)
    const dataFormatada = [data.getFullYear(), String(data.getMonth() + 1).padStart(2, "0"), String(data.getDate()).padStart(2, "0")].join("-")
    const horarios: string[] = []
    for (let minutos = 0; minutos < 24 * 60; minutos += 60) {
      const hora = Math.floor(minutos / 60)
      const minuto = minutos % 60
      const horario = `${String(hora).padStart(2, "0")}:${String(minuto).padStart(2, "0")}`
      if (lojaAbertaNoHorario(petshop, dataFormatada, horario) && !ocupados.has(`${dataFormatada}|${horario}`)) horarios.push(horario)
    }
    if (horarios.length > 0) resultado.push({ data: dataFormatada, horarios })
  }
  return resultado
}

router.get("/disponibilidade/:petshopId", async (req, res) => {
  const petshopId = Number(req.params.petshopId)
  if (!Number.isInteger(petshopId)) return res.status(400).json({ erro: "Petshop inválida" })
  try {
    const petshop = await prisma.petshop.findFirst({ where: { id: petshopId, ativo: true }, select: { diasFuncionamento: true, horario: true } })
    if (!petshop) return res.status(404).json({ erro: "Petshop não encontrada" })
    const ocupados = await prisma.orcamento.findMany({
      where: { petshopId, status: { not: StatusOrcamento.CANCELADO }, dataAgendamento: { not: null }, horarioAgendamento: { not: null } },
      select: { dataAgendamento: true, horarioAgendamento: true },
    })
    const chaves = new Set(ocupados.map((item) => `${item.dataAgendamento}|${item.horarioAgendamento}`))
    res.json({ intervaloMinutos: 60, dias: gerarDisponibilidade(petshop, chaves) })
  } catch (error) {
    console.error(error)
    res.status(500).json({ erro: "Erro ao buscar horários disponíveis" })
  }
})

router.post("/", autentica, async (req: AuthRequest, res) => {
  const valida = pedidoSchema.safeParse(req.body)
  if (!valida.success) return res.status(400).json({ erro: valida.error.issues[0].message })
  if (req.user?.role === "admin") return res.status(403).json({ erro: "Administradores não podem enviar orçamentos como cliente" })

  try {
    const [cliente, petshop] = await Promise.all([
      prisma.cliente.findUnique({ where: { id: req.user?.id } }),
      prisma.petshop.findFirst({ where: { id: valida.data.petshopId, ativo: true }, include: { servicos: { where: { ativo: true } } } }),
    ])
    if (!cliente) return res.status(404).json({ erro: "Cliente não encontrado" })
    if (!petshop) return res.status(404).json({ erro: "Petshop não encontrada" })
    if (!lojaAbertaNoHorario(petshop, valida.data.dataAgendamento, valida.data.horarioAgendamento)) return res.status(400).json({ erro: "A loja não atende neste dia ou horário" })

    const selecionados = petshop.servicos.filter((servico) => valida.data.servicoIds.includes(servico.id))
    if (selecionados.length !== new Set(valida.data.servicoIds).size) return res.status(400).json({ erro: "Um ou mais serviços não estão disponíveis" })

    const totalEstimado = selecionados.every((servico) => servico.preco != null)
      ? selecionados.reduce((total, servico) => total + (servico.preco || 0), 0)
      : null
    const token = crypto.randomBytes(24).toString("hex")
    const orcamento = await prisma.orcamento.create({
      data: {
        token,
        petshopId: petshop.id,
        clienteId: cliente.id,
        observacao: valida.data.observacao,
        dataAgendamento: valida.data.dataAgendamento,
        horarioAgendamento: valida.data.horarioAgendamento,
        totalEstimado,
        servicosJson: JSON.stringify(selecionados.map((servico) => ({ nome: servico.nome, preco: servico.preco }))),
      },
    })

    const respostaUrl = `${frontendUrl()}/orcamentos/responder/${token}`
    const servicosHtml = selecionados.map((servico) => `<li>${servico.nome} - ${servico.preco == null ? "Sob consulta" : `R$ ${servico.preco.toFixed(2)}`}</li>`).join("")
    const emailPetshop = petshop.email
      ? enviarEmail(petshop.email, `Novo pedido de orçamento - ${petshop.nome}`, `<p>Cliente: <strong>${cliente.nome}</strong> (${cliente.email})</p><ul>${servicosHtml}</ul><p>${valida.data.observacao || "Sem observações."}</p><p><a href="${respostaUrl}">Responder orçamento</a></p>`)
      : Promise.resolve()
    const emailCliente = cliente.email
      ? enviarEmail(cliente.email, `Pedido de orçamento enviado para ${petshop.nome}`, `<p>Olá, ${cliente.nome}.</p><p>Seu pedido foi enviado para <strong>${petshop.nome}</strong>. A petshop poderá responder por e-mail.</p><ul>${servicosHtml}</ul>`)
      : Promise.resolve()

    await Promise.allSettled([emailPetshop, emailCliente])
    res.status(201).json({ id: orcamento.id, token, respostaUrl })
  } catch (error: any) {
    console.error("Erro ao criar orçamento:", error)
    if (error?.code === "P2002") return res.status(409).json({ erro: "Este horário acabou de ser reservado. Escolha outro." })
    res.status(500).json({ erro: "Erro ao enviar pedido de orçamento" })
  }
})

// Histórico do usuário autenticado.
router.get("/cliente", autentica, async (req: AuthRequest, res) => {
  if (req.user?.role !== "user" && req.user?.role !== "USER") return res.status(403).json({ erro: "Apenas clientes podem acessar este histórico" })
  try {
    const orcamentos = await prisma.orcamento.findMany({ where: { clienteId: req.user.id }, include: { petshop: true }, orderBy: { criadoEm: "desc" } })
    res.json(orcamentos)
  } catch (error) {
    console.error(error)
    res.status(500).json({ erro: "Erro ao buscar histórico" })
  }
})

// Histórico recebido pela petshop autenticada.
router.get("/petshop", autentica, async (req: AuthRequest, res) => {
  if (req.user?.role !== "petshop") return res.status(403).json({ erro: "Apenas petshops podem acessar este histórico" })
  try {
    const orcamentos = await prisma.orcamento.findMany({ where: { petshopId: req.user.id }, include: { cliente: { select: { id: true, nome: true, email: true, telefone: true } }, petshop: true }, orderBy: { criadoEm: "desc" } })
    res.json(orcamentos)
  } catch (error) {
    console.error(error)
    res.status(500).json({ erro: "Erro ao buscar pedidos recebidos" })
  }
})

// Admin visualiza todo o histórico.
router.get("/admin", autentica, async (req: AuthRequest, res) => {
  if (req.user?.role !== "admin") return res.status(403).json({ erro: "Apenas administradores podem acessar este histórico" })
  try {
    const orcamentos = await prisma.orcamento.findMany({ include: { petshop: true, cliente: { select: { id: true, nome: true, email: true } } }, orderBy: { criadoEm: "desc" } })
    res.json(orcamentos)
  } catch (error) {
    console.error(error)
    res.status(500).json({ erro: "Erro ao buscar histórico administrativo" })
  }
})

// Petshop ou admin atualiza o status do pedido.
router.patch("/:id/status", autentica, async (req: AuthRequest, res) => {
  const id = Number(req.params.id)
  const valida = statusSchema.safeParse(req.body)
  if (!id || !valida.success) return res.status(400).json({ erro: valida.success ? "Pedido inválido" : valida.error.issues[0].message })

  try {
    const atual = await prisma.orcamento.findUnique({ where: { id }, include: { petshop: true, cliente: true } })
    if (!atual) return res.status(404).json({ erro: "Pedido não encontrado" })
    if (req.user?.role !== "admin" && (req.user?.role !== "petshop" || req.user.id !== atual.petshopId)) return res.status(403).json({ erro: "Você não pode alterar este pedido" })

    const atualizado = await prisma.orcamento.update({ where: { id }, data: { status: valida.data.status } })
    const nomes: Record<string, string> = {
      SOLICITACAO_ABERTA: "solicitação em aberto",
      SERVICO_AGENDADO: "serviço agendado",
      FINALIZADO: "serviço finalizado",
      CANCELADO: "pedido cancelado",
    }
    if (atual.cliente.email) {
      const avaliacaoUrl = `${frontendUrl()}/orcamentos`
      await enviarEmail(atual.cliente.email, `Atualização do pedido - ${atual.petshop.nome}`, `<p>Olá, ${atual.cliente.nome}.</p><p>Seu pedido agora está como: <strong>${nomes[valida.data.status]}</strong>.</p>${valida.data.status === "FINALIZADO" ? `<p>Conte como foi sua experiência: <a href="${avaliacaoUrl}">avaliar a petshop</a>.</p>` : ""}`)
    }
    res.json(atualizado)
  } catch (error) {
    console.error(error)
    res.status(500).json({ erro: "Erro ao atualizar status" })
  }
})

router.patch("/:id/cancelar", autentica, async (req: AuthRequest, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) return res.status(400).json({ erro: "Pedido inválido" })
  try {
    const pedido = await prisma.orcamento.findUnique({ where: { id } })
    if (!pedido || pedido.clienteId !== req.user?.id) return res.status(404).json({ erro: "Pedido não encontrado" })
    if (pedido.status !== StatusOrcamento.SERVICO_AGENDADO && pedido.status !== StatusOrcamento.SOLICITACAO_ABERTA) return res.status(409).json({ erro: "Este pedido não pode ser cancelado" })
    const atualizado = await prisma.orcamento.update({ where: { id }, data: { status: StatusOrcamento.CANCELADO } })
    res.json(atualizado)
  } catch (error) {
    console.error(error)
    res.status(500).json({ erro: "Erro ao cancelar agendamento" })
  }
})

router.post("/:id/avaliacao", autentica, async (req: AuthRequest, res) => {
  const id = Number(req.params.id)
  const valida = avaliacaoSchema.safeParse(req.body)
  if (!id || !valida.success) return res.status(400).json({ erro: valida.success ? "Pedido inválido" : valida.error.issues[0].message })

  try {
    const pedido = await prisma.orcamento.findUnique({ where: { id } })
    if (!pedido || pedido.clienteId !== req.user?.id) return res.status(404).json({ erro: "Pedido não encontrado" })
    if (pedido.status !== StatusOrcamento.FINALIZADO) return res.status(400).json({ erro: "A avaliação só está disponível após a finalização" })
    if (pedido.avaliacaoNota) return res.status(409).json({ erro: "Este pedido já foi avaliado" })

    const resultado = await prisma.$transaction(async (tx) => {
      const petshop = await tx.petshop.findUniqueOrThrow({ where: { id: pedido.petshopId } })
      const totalNotas = petshop.avaliacaoMedia * petshop.totalAvaliacoes + valida.data.nota
      const totalAvaliacoes = petshop.totalAvaliacoes + 1
      await tx.petshop.update({ where: { id: pedido.petshopId }, data: { avaliacaoMedia: totalNotas / totalAvaliacoes, totalAvaliacoes } })
      return tx.orcamento.update({ where: { id }, data: { avaliacaoNota: valida.data.nota, avaliacaoComentario: valida.data.comentario } })
    })
    res.json(resultado)
  } catch (error) {
    console.error(error)
    res.status(500).json({ erro: "Erro ao salvar avaliação" })
  }
})

router.get("/responder/:token", async (req, res) => {
  try {
    const orcamento = await prisma.orcamento.findUnique({ where: { token: req.params.token }, include: { petshop: true, cliente: { select: { nome: true } } } })
    if (!orcamento) return res.status(404).json({ erro: "Orçamento não encontrado" })
    res.json(orcamento)
  } catch (error) {
    console.error(error)
    res.status(500).json({ erro: "Erro ao buscar orçamento" })
  }
})

router.patch("/responder/:token", async (req, res) => {
  const resposta = z.object({ resposta: z.string().trim().min(2).max(1000) }).safeParse(req.body)
  if (!resposta.success) return res.status(400).json({ erro: resposta.error.issues[0].message })

  try {
    const orcamento = await prisma.orcamento.findUnique({ where: { token: req.params.token }, include: { petshop: true, cliente: true } })
    if (!orcamento) return res.status(404).json({ erro: "Orçamento não encontrado" })
    if (orcamento.status !== StatusOrcamento.SOLICITACAO_ABERTA) return res.status(409).json({ erro: "Este orçamento já foi respondido" })

    const atualizado = await prisma.orcamento.update({ where: { id: orcamento.id }, data: { resposta: resposta.data.resposta, status: StatusOrcamento.SERVICO_AGENDADO } })
    if (orcamento.cliente.email) await enviarEmail(orcamento.cliente.email, `Resposta da ${orcamento.petshop.nome} sobre seu orçamento`, `<p>Olá, ${orcamento.cliente.nome}.</p><p>A petshop respondeu ao seu pedido:</p><blockquote>${resposta.data.resposta}</blockquote>`)
    res.json(atualizado)
  } catch (error) {
    console.error(error)
    res.status(500).json({ erro: "Erro ao responder orçamento" })
  }
})

export default router