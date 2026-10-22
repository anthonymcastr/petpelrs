"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const express_1 = require("express");
const bcrypt_1 = __importDefault(require("bcrypt"));
const zod_1 = require("zod");
const email_1 = require("../utils/email");
const prisma = new client_1.PrismaClient();
const router = (0, express_1.Router)();
// Função de validação de CPF
function validaCPF(cpf) {
    cpf = cpf.replace(/\D/g, "");
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf))
        return false;
    let soma = 0, resto;
    for (let i = 1; i <= 9; i++)
        soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11)
        resto = 0;
    if (resto !== parseInt(cpf.substring(9, 10)))
        return false;
    soma = 0;
    for (let i = 1; i <= 10; i++)
        soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11)
        resto = 0;
    if (resto !== parseInt(cpf.substring(10, 11)))
        return false;
    return true;
}
// Esquema de validação do cliente
const clienteSchema = zod_1.z.object({
    nome: zod_1.z.string().min(10, { message: "Nome do cliente deve possuir, no mínimo, 10 caracteres" }),
    email: zod_1.z.string().email({ message: "Informe um e-mail válido" }),
    senha: zod_1.z.string(),
    telefone: zod_1.z.string().min(8, { message: "Informe um telefone válido" }),
    cpf: zod_1.z.string().refine(validaCPF, { message: "CPF inválido" })
});
// ---------------------------
// LISTAR CLIENTES
router.get("/", async (req, res) => {
    try {
        const clientes = await prisma.cliente.findMany();
        res.status(200).json(clientes);
    }
    catch (error) {
        res.status(400).json({ error });
    }
});
// ---------------------------
// CADASTRO DE CLIENTE COMUM
router.post("/cadastro", async (req, res) => {
    try {
        const parseResult = clienteSchema.safeParse(req.body);
        if (!parseResult.success) {
            return res.status(400).json({ error: parseResult.error.errors.map(e => e.message).join(", ") });
        }
        const { nome, email, senha, telefone, cpf } = parseResult.data;
        const existente = await prisma.cliente.findUnique({ where: { email } });
        if (existente)
            return res.status(400).json({ error: "E-mail já cadastrado" });
        const errosSenha = validaSenha(senha);
        if (errosSenha.length > 0)
            return res.status(400).json({ error: errosSenha.join(", ") });
        const hash = await bcrypt_1.default.hash(senha, 10);
        const cliente = await prisma.cliente.create({
            data: { nome, email, senha: hash, telefone, cpf, role: "USER" }
        });
        // Enviar email de boas-vindas
        const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1e293b, #0c4a6e); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0;">🐾 Bem-vindo ao PetPel!</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
          <h2 style="color: #1e293b;">Olá, ${nome.split(' ')[0]}!</h2>
          <p style="color: #334155; line-height: 1.6;">
            Seu cadastro foi realizado com sucesso! Agora você faz parte da nossa comunidade de amantes de animais.
          </p>
          <p style="color: #334155; line-height: 1.6;">
            Com sua conta você pode:
          </p>
          <ul style="color: #334155; line-height: 1.8;">
            <li>🐕 Cadastrar animais para adoção</li>
            <li>💬 Enviar mensagens para outros usuários</li>
            <li>❤️ Encontrar seu novo melhor amigo</li>
          </ul>
          <div style="text-align: center; margin-top: 30px;">
            <a href="https://www.petpelrs.com.br/login" 
               style="background: #1e293b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Acessar Minha Conta
            </a>
          </div>
          <p style="color: #64748b; font-size: 12px; text-align: center; margin-top: 30px;">
            Se você não criou esta conta, ignore este email.
          </p>
        </div>
      </div>
    `;
        try {
            await (0, email_1.enviarEmail)(email, "🐾 Bem-vindo ao PetPel!", emailHtml);
        }
        catch (err) {
            console.error("⚠️ Falha ao enviar email, cadastro mantido:", err);
        }
        res.status(201).json({
            id: cliente.id,
            nome: cliente.nome,
            email: cliente.email,
            telefone: cliente.telefone,
            role: cliente.role
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao cadastrar cliente" });
    }
});
// ---------------------------
// LOGIN DE CLIENTE
router.post("/login", async (req, res) => {
    try {
        const { email, senha } = req.body;
        if (!email || !senha)
            return res.status(400).json({ error: "E-mail e senha são obrigatórios" });
        const cliente = await prisma.cliente.findUnique({ where: { email } });
        if (!cliente)
            return res.status(401).json({ error: "E-mail ou senha incorretos" });
        const senhaValida = await bcrypt_1.default.compare(senha, cliente.senha);
        if (!senhaValida)
            return res.status(401).json({ error: "E-mail ou senha incorretos" });
        res.status(200).json({
            id: cliente.id,
            nome: cliente.nome,
            email: cliente.email,
            telefone: cliente.telefone,
            role: cliente.role
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao realizar login" });
    }
});
// ---------------------------
// FUNÇÃO DE VALIDAÇÃO DE SENHA
function validaSenha(senha) {
    const mensa = [];
    if (senha.length < 8)
        mensa.push("Senha deve possuir no mínimo 8 caracteres");
    let pequenas = 0;
    let grandes = 0;
    let numeros = 0;
    let simbolos = 0;
    for (const letra of senha) {
        if (/[a-z]/.test(letra))
            pequenas++;
        else if (/[A-Z]/.test(letra))
            grandes++;
        else if (/[0-9]/.test(letra))
            numeros++;
        else
            simbolos++;
    }
    if (pequenas === 0)
        mensa.push("Senha deve possuir letra(s) minúscula(s)");
    if (grandes === 0)
        mensa.push("Senha deve possuir letra(s) maiúscula(s)");
    if (numeros === 0)
        mensa.push("Senha deve possuir número(s)");
    if (simbolos === 0)
        mensa.push("Senha deve possuir símbolo(s)");
    return mensa;
}
exports.default = router;
