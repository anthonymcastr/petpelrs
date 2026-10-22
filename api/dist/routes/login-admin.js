"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcrypt_1 = __importDefault(require("bcrypt"));
const client_1 = require("@prisma/client");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma = new client_1.PrismaClient();
const router = (0, express_1.Router)();
router.post("/", async (req, res) => {
    try {
        const { email, senha } = req.body;
        if (!email || !senha) {
            return res.status(400).json({
                erro: "Email e senha obrigatórios"
            });
        }
        const admin = await prisma.admin.findUnique({
            where: { email }
        });
        if (!admin) {
            return res.status(401).json({
                erro: "Administrador não encontrado"
            });
        }
        const senhaValida = await bcrypt_1.default.compare(senha, admin.senha);
        if (!senhaValida) {
            return res.status(401).json({
                erro: "Senha incorreta"
            });
        }
        const token = jsonwebtoken_1.default.sign({
            id: admin.id,
            role: admin.role,
        }, process.env.JWT_SECRET || process.env.JWT_KEY || "segredo", { expiresIn: "1h" });
        return res.status(200).json({
            id: admin.id,
            nome: admin.nome,
            email: admin.email,
            role: admin.role,
            token
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            erro: "Erro ao realizar login admin"
        });
    }
});
exports.default = router;
