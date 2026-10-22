"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const router = (0, express_1.Router)();
const bcrypt_1 = __importDefault(require("bcrypt"));
router.post("/cadastro", async (req, res) => {
    try {
        const { nome, email, senha } = req.body;
        if (!nome || !email || !senha) {
            return res.status(400).json({
                erro: "Nome, email e senha são obrigatórios"
            });
        }
        const adminExistente = await prisma.admin.findUnique({
            where: { email }
        });
        if (adminExistente) {
            return res.status(400).json({
                erro: "Administrador já cadastrado"
            });
        }
        const senhaHash = await bcrypt_1.default.hash(senha, 10);
        const admin = await prisma.admin.create({
            data: {
                nome,
                email,
                senha: senhaHash,
                role: "admin"
            }
        });
        return res.status(201).json({
            id: admin.id,
            nome: admin.nome,
            email: admin.email,
            role: admin.role
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            erro: "Erro ao cadastrar administrador"
        });
    }
});
router.get("/", async (req, res) => {
    try {
        const totalClientes = await prisma.cliente.count();
        const totalAnimais = await prisma.animal.count();
        const totalContatos = await prisma.contato.count();
        return res.status(200).json({
            totalClientes,
            totalAnimais,
            totalContatos
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            erro: "Erro ao buscar dados admin"
        });
    }
});
exports.default = router;
