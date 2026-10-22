"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const client_1 = require("@prisma/client");
const express_1 = require("express");
const prisma = new client_1.PrismaClient();
const router = (0, express_1.Router)();
router.post("/", async (req, res) => {
    const { email, senha } = req.body;
    if (!email || !senha)
        return res.status(400).json({ erro: "E-mail e senha obrigatórios" });
    try {
        const petshop = await prisma.petshop.findFirst({ where: { email, ativo: true } });
        if (!petshop?.senha || !(await bcrypt_1.default.compare(senha, petshop.senha)))
            return res.status(401).json({ erro: "E-mail ou senha incorretos" });
        const token = jsonwebtoken_1.default.sign({ id: petshop.id, role: "petshop" }, process.env.JWT_SECRET || process.env.JWT_KEY || "segredo", { expiresIn: "8h" });
        res.json({ id: petshop.id, nome: petshop.nome, email: petshop.email, role: "petshop", token });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Erro ao realizar login da petshop" });
    }
});
exports.default = router;
