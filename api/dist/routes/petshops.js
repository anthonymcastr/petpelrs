"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const express_1 = require("express");
const zod_1 = require("zod");
const bcrypt_1 = __importDefault(require("bcrypt"));
const autentica_1 = require("../middleware/autentica");
const prisma = new client_1.PrismaClient();
const router = (0, express_1.Router)();
function somenteAdmin(req, res, next) {
    if (req.user?.role !== "admin") {
        return res.status(403).json({ erro: "Apenas administradores podem gerenciar petshops" });
    }
    next();
}
const petshopSchema = zod_1.z.object({
    nome: zod_1.z.string().trim().min(2),
    descricao: zod_1.z.string().trim().optional().nullable(),
    logoUrl: zod_1.z.string().trim().url().optional().nullable(),
    endereco: zod_1.z.string().trim().optional().nullable(),
    horario: zod_1.z.string().trim().optional().nullable(),
    diasFuncionamento: zod_1.z.string().trim().optional().nullable(),
    whatsapp: zod_1.z.string().trim().min(8),
    email: zod_1.z.string().email().optional().nullable(),
    senha: zod_1.z.string().min(6).optional(),
});
const servicoSchema = zod_1.z.object({
    nome: zod_1.z.string().trim().min(2),
    descricao: zod_1.z.string().trim().optional().nullable(),
    preco: zod_1.z.number().nonnegative().optional().nullable(),
});
const cadastroSchema = petshopSchema.extend({
    senha: zod_1.z.string().min(8, "A senha deve ter pelo menos 8 caracteres"),
    confirmarSenha: zod_1.z.string(),
}).refine((dados) => dados.senha === dados.confirmarSenha, {
    message: "As senhas não conferem",
    path: ["confirmarSenha"],
});
const adminPetshopSchema = petshopSchema.extend({
    confirmarSenha: zod_1.z.string().optional(),
}).refine((dados) => !dados.senha || dados.senha === dados.confirmarSenha, {
    message: "As senhas não conferem",
    path: ["confirmarSenha"],
});
async function geocodificar(endereco) {
    if (!endereco?.trim())
        return { latitude: null, longitude: null };
    try {
        const consulta = `${endereco.trim()}, Pelotas, RS, Brasil`;
        const resposta = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=br&q=${encodeURIComponent(consulta)}`, {
            headers: { "User-Agent": "PetPelRS/1.0" },
        });
        const dados = await resposta.json();
        if (!dados[0])
            return { latitude: null, longitude: null };
        return { latitude: Number(Number(dados[0].lat).toFixed(3)), longitude: Number(Number(dados[0].lon).toFixed(3)) };
    }
    catch (error) {
        console.warn("Não foi possível localizar a petshop:", error);
        return { latitude: null, longitude: null };
    }
}
// Só devolve serviços ativos, em ordem alfabética
const includeServicos = {
    servicos: {
        where: { ativo: true },
        orderBy: { nome: "asc" },
    },
};
function semSenha(petshop) {
    const { senha: _senha, ...seguro } = petshop;
    return seguro;
}
// ========================
// ADMIN - PETSHOPS E SERVIÇOS
// ========================
router.post("/cadastro", async (req, res) => {
    const valida = cadastroSchema.safeParse(req.body);
    if (!valida.success)
        return res.status(400).json({ erro: valida.error.errors[0].message });
    try {
        const { senha, confirmarSenha: _confirmarSenha, ...dados } = valida.data;
        const localizacao = await geocodificar(dados.endereco);
        const petshop = await prisma.petshop.create({
            data: { ...dados, ...localizacao, senha: await bcrypt_1.default.hash(senha, 10) },
        });
        res.status(201).json({ id: petshop.id, nome: petshop.nome, email: petshop.email });
    }
    catch (error) {
        console.error(error);
        if (error?.code === "P2002")
            return res.status(409).json({ erro: "Este e-mail já está cadastrado para uma petshop" });
        res.status(500).json({ erro: "Erro ao cadastrar petshop" });
    }
});
router.get("/admin", autentica_1.autentica, somenteAdmin, async (_req, res) => {
    try {
        const petshops = await prisma.petshop.findMany({
            include: { servicos: { orderBy: { nome: "asc" } } },
            orderBy: { nome: "asc" },
        });
        res.json(petshops.map(semSenha));
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Erro ao buscar petshops para administração" });
    }
});
router.post("/admin", autentica_1.autentica, somenteAdmin, async (req, res) => {
    const valida = adminPetshopSchema.safeParse(req.body);
    if (!valida.success)
        return res.status(400).json({ erro: valida.error.errors[0].message });
    try {
        const { senha, confirmarSenha: _confirmarSenha, ...dados } = valida.data;
        const petshop = await prisma.petshop.create({ data: { ...dados, senha: senha ? await bcrypt_1.default.hash(senha, 10) : null } });
        res.status(201).json(semSenha(petshop));
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Erro ao cadastrar petshop" });
    }
});
router.put("/admin/:id", autentica_1.autentica, somenteAdmin, async (req, res) => {
    const id = Number(req.params.id);
    const valida = adminPetshopSchema.safeParse(req.body);
    if (!id || !valida.success)
        return res.status(400).json({ erro: valida.success ? "Petshop inválida" : valida.error.errors[0].message });
    try {
        const { senha, confirmarSenha: _confirmarSenha, ...dados } = valida.data;
        const localizacao = await geocodificar(dados.endereco);
        const petshop = await prisma.petshop.update({ where: { id }, data: senha ? { ...dados, ...localizacao, senha: await bcrypt_1.default.hash(senha, 10) } : { ...dados, ...localizacao } });
        res.json(semSenha(petshop));
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Erro ao editar petshop" });
    }
});
router.patch("/admin/:id/status", autentica_1.autentica, somenteAdmin, async (req, res) => {
    const id = Number(req.params.id);
    if (!id || typeof req.body.ativo !== "boolean")
        return res.status(400).json({ erro: "Status inválido" });
    try {
        const petshop = await prisma.petshop.update({ where: { id }, data: { ativo: req.body.ativo } });
        res.json(semSenha(petshop));
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Erro ao alterar status da petshop" });
    }
});
router.post("/admin/:id/servicos", autentica_1.autentica, somenteAdmin, async (req, res) => {
    const petshopId = Number(req.params.id);
    const valida = servicoSchema.safeParse(req.body);
    if (!petshopId || !valida.success)
        return res.status(400).json({ erro: valida.success ? "Petshop inválida" : valida.error.errors[0].message });
    try {
        const servico = await prisma.servico.create({ data: { ...valida.data, petshopId } });
        res.status(201).json(servico);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Erro ao cadastrar serviço" });
    }
});
router.put("/admin/servicos/:servicoId", autentica_1.autentica, somenteAdmin, async (req, res) => {
    const id = Number(req.params.servicoId);
    const valida = servicoSchema.safeParse(req.body);
    if (!id || !valida.success)
        return res.status(400).json({ erro: valida.success ? "Serviço inválido" : valida.error.errors[0].message });
    try {
        const servico = await prisma.servico.update({ where: { id }, data: valida.data });
        res.json(servico);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Erro ao editar serviço" });
    }
});
router.patch("/admin/servicos/:servicoId/status", autentica_1.autentica, somenteAdmin, async (req, res) => {
    const id = Number(req.params.servicoId);
    if (!id || typeof req.body.ativo !== "boolean")
        return res.status(400).json({ erro: "Status inválido" });
    try {
        const servico = await prisma.servico.update({ where: { id }, data: { ativo: req.body.ativo } });
        res.json(servico);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Erro ao alterar status do serviço" });
    }
});
// ========================
// GET - LISTA DE PETSHOPS ATIVAS
// ========================
router.get("/", async (req, res) => {
    try {
        const petshops = await prisma.petshop.findMany({
            where: { ativo: true },
            include: includeServicos,
            orderBy: { nome: "asc" },
        });
        const comLocalizacao = await Promise.all(petshops.map(async (petshop) => petshop.latitude != null && petshop.longitude != null ? petshop : { ...petshop, ...(await geocodificar(petshop.endereco)) }));
        res.status(200).json(comLocalizacao.map(semSenha));
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Erro ao buscar petshops" });
    }
});
// ========================
// GET - PETSHOP POR ID
// ========================
router.get("/:id", async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
        return res.status(400).json({ erro: "Identificador inválido" });
    }
    try {
        const petshop = await prisma.petshop.findFirst({
            where: { id, ativo: true },
            include: includeServicos,
        });
        if (!petshop) {
            return res.status(404).json({ erro: "Petshop não encontrada" });
        }
        const comLocalizacao = petshop.latitude != null && petshop.longitude != null ? petshop : { ...petshop, ...(await geocodificar(petshop.endereco)) };
        res.status(200).json(semSenha(comLocalizacao));
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Erro ao buscar petshop" });
    }
});
exports.default = router;
