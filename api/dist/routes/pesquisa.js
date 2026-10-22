"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const animais_1 = __importDefault(require("./animais"));
const prisma = new client_1.PrismaClient();
function normalizarTexto(texto) {
    return texto
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase();
}
animais_1.default.get("/", async (req, res) => {
    const termoOriginal = req.query.termo?.trim();
    if (!termoOriginal) {
        return res.status(400).json({ erro: "O termo de busca é obrigatório." });
    }
    const termoNormalizado = normalizarTexto(termoOriginal);
    try {
        // 1️⃣ Busca tudo (ou apenas campos necessários)
        const animais = await prisma.animal.findMany({
            where: { arquivado: false },
            select: {
                id: true,
                nome: true,
                raca: true,
                tipo: true,
                idade: true,
                cidade: true,
                urlImagem: true,
            },
        });
        // 2️⃣ Filtra em memória usando normalização
        const resultados = animais.filter((animal) => {
            const nomeNorm = normalizarTexto(animal.nome);
            const racaNorm = normalizarTexto(animal.raca);
            const tipoNorm = normalizarTexto(animal.tipo);
            return (nomeNorm.includes(termoNormalizado) ||
                racaNorm.includes(termoNormalizado) ||
                tipoNorm.includes(termoNormalizado));
        });
        res.json(resultados);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Erro ao buscar dados." });
    }
});
exports.default = animais_1.default;
