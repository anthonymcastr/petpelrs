"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const express_1 = require("express");
const zod_1 = require("zod");
const autentica_1 = require("../middleware/autentica");
const email_1 = require("../utils/email");
const prisma = new client_1.PrismaClient();
const router = (0, express_1.Router)();
const solicitacaoSchema = zod_1.z.object({
    descricao: zod_1.z.string().trim().min(5, "Informe pelo menos 5 caracteres sobre o motivo do arquivamento"),
});
function somenteAdmin(req, res, next) {
    if (req.user?.role !== "admin") {
        return res.status(403).json({ erro: "Apenas administradores podem acessar esta área" });
    }
    next();
}
// Usuário solicita o arquivamento do próprio animal encontrado.
router.post("/animais/:animalId", autentica_1.autentica, async (req, res) => {
    const animalId = Number(req.params.animalId);
    const valida = solicitacaoSchema.safeParse(req.body);
    console.info("[arquivamento] POST recebido", {
        animalId,
        usuarioId: req.user?.id,
        role: req.user?.role,
        bodyKeys: Object.keys(req.body ?? {}),
        descricaoCaracteres: typeof req.body?.descricao === "string" ? req.body.descricao.trim().length : 0,
    });
    if (!animalId || !valida.success) {
        console.warn("[arquivamento] Requisição inválida", {
            animalId,
            erro: valida.success ? "Animal inválido" : valida.error.errors[0].message,
        });
        return res.status(400).json({ erro: valida.success ? "Animal inválido" : valida.error.errors[0].message });
    }
    try {
        const animal = await prisma.animal.findUnique({ where: { id: animalId } });
        if (!animal)
            return res.status(404).json({ erro: "Animal não encontrado" });
        if (req.user?.role === "admin") {
            const arquivado = await prisma.animal.update({
                where: { id: animalId },
                data: { arquivado: true },
            });
            return res.json(arquivado);
        }
        if (animal.usuarioId !== req.user?.id)
            return res.status(403).json({ erro: "Você só pode solicitar o arquivamento do seu próprio animal" });
        if (animal.arquivado)
            return res.status(400).json({ erro: "Este animal já está arquivado" });
        const pendente = await prisma.solicitacaoArquivamento.findFirst({
            where: { animalId, status: client_1.StatusSolicitacaoArquivamento.PENDENTE },
        });
        if (pendente)
            return res.status(409).json({ erro: "Já existe uma solicitação pendente para este animal" });
        const solicitacao = await prisma.solicitacaoArquivamento.create({
            data: {
                animalId,
                solicitanteId: req.user.id,
                descricao: valida.data.descricao,
            },
            include: { animal: true },
        });
        return res.status(201).json(solicitacao);
    }
    catch (error) {
        console.error("[arquivamento] Erro ao criar/arquivar animal", error);
        return res.status(500).json({ erro: "Erro ao criar solicitação de arquivamento" });
    }
});
// Usuário acompanha a decisão e a resposta do administrador.
router.get("/minhas", autentica_1.autentica, async (req, res) => {
    if (req.user?.role === "admin")
        return res.json([]);
    try {
        const solicitacoes = await prisma.solicitacaoArquivamento.findMany({
            where: { solicitanteId: req.user?.id },
            include: { animal: true },
            orderBy: { criadoEm: "desc" },
        });
        return res.json(solicitacoes);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ erro: "Erro ao buscar solicitações" });
    }
});
// Admin recebe as solicitações pendentes.
router.get("/admin", autentica_1.autentica, somenteAdmin, async (_req, res) => {
    try {
        const solicitacoes = await prisma.solicitacaoArquivamento.findMany({
            where: { status: client_1.StatusSolicitacaoArquivamento.PENDENTE },
            include: {
                animal: true,
                solicitante: { select: { id: true, nome: true, email: true, telefone: true } },
            },
            orderBy: { criadoEm: "asc" },
        });
        return res.json(solicitacoes);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ erro: "Erro ao buscar solicitações" });
    }
});
const decisaoSchema = zod_1.z.object({
    status: zod_1.z.enum(["APROVADA", "RECUSADA"]),
    resposta: zod_1.z.string().trim().min(2, "Informe uma resposta ao usuário"),
});
// Admin aprova ou recusa, registrando a resposta para o solicitante.
router.patch("/admin/:id", autentica_1.autentica, somenteAdmin, async (req, res) => {
    const id = Number(req.params.id);
    const valida = decisaoSchema.safeParse(req.body);
    if (!id || !valida.success) {
        return res.status(400).json({ erro: valida.success ? "Solicitação inválida" : valida.error.errors[0].message });
    }
    try {
        const solicitacao = await prisma.solicitacaoArquivamento.findUnique({
            where: { id },
            include: { animal: true, solicitante: true },
        });
        if (!solicitacao)
            return res.status(404).json({ erro: "Solicitação não encontrada" });
        if (solicitacao.status !== client_1.StatusSolicitacaoArquivamento.PENDENTE)
            return res.status(409).json({ erro: "Esta solicitação já foi analisada" });
        const aprovada = valida.data.status === "APROVADA";
        const resultado = await prisma.$transaction(async (tx) => {
            const atualizada = await tx.solicitacaoArquivamento.update({
                where: { id },
                data: {
                    status: valida.data.status,
                    resposta: valida.data.resposta,
                    adminId: req.user?.id,
                },
                include: { animal: true, solicitante: true },
            });
            if (aprovada) {
                await tx.animal.update({
                    where: { id: solicitacao.animalId },
                    data: { arquivado: true },
                });
            }
            return atualizada;
        });
        if (solicitacao.solicitante.email) {
            try {
                await (0, email_1.enviarEmail)(solicitacao.solicitante.email, `Solicitação de arquivamento: ${aprovada ? "aprovada" : "recusada"}`, `<p>Olá, ${solicitacao.solicitante.nome}.</p><p>A solicitação para arquivar <strong>${solicitacao.animal.nome}</strong> foi <strong>${aprovada ? "aprovada" : "recusada"}</strong>.</p><p>Resposta do administrador: ${valida.data.resposta}</p>`);
            }
            catch (error) {
                console.warn("Não foi possível enviar o e-mail da decisão:", error);
            }
        }
        return res.json(resultado);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ erro: "Erro ao analisar solicitação" });
    }
});
exports.default = router;
