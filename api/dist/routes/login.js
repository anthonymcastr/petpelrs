"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const express_1 = require("express");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma = new client_1.PrismaClient();
const router = (0, express_1.Router)();
router.post("/", async (req, res) => {
    const { email, senha } = req.body;
    const mensaPadrao = "Login ou senha incorretos";
    if (!email || !senha) {
        res.status(400).json({ erro: mensaPadrao });
        return;
    }
    try {
        const cliente = await prisma.cliente.findFirst({
            where: { email }
        });
        if (cliente == null) {
            res.status(400).json({ erro: mensaPadrao });
            return;
        }
        if (bcrypt_1.default.compareSync(senha, cliente.senha)) {
            // inclui role no token
            const token = jsonwebtoken_1.default.sign({
                clienteLogadoId: cliente.id,
                clienteLogadoNome: cliente.nome,
                clienteLogadoRole: cliente.role, // user ou admin
            }, process.env.JWT_SECRET || process.env.JWT_KEY || "segredo", { expiresIn: "1h" });
            res.status(200).json({
                id: cliente.id,
                nome: cliente.nome,
                email: cliente.email,
                role: cliente.role, // retorna no JSON
                token
            });
        }
        else {
            res.status(400).json({ erro: mensaPadrao });
        }
    }
    catch (error) {
        res.status(400).json(error);
    }
});
exports.default = router;
