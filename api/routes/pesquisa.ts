import { PrismaClient } from "@prisma/client";
import router from "./animais";

const prisma = new PrismaClient();

function normalizarTexto(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

router.get("/", async (req, res) => {
  const termoOriginal = (req.query.termo as string)?.trim();

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

      return (
        nomeNorm.includes(termoNormalizado) ||
        racaNorm.includes(termoNormalizado) ||
        tipoNorm.includes(termoNormalizado)
      );
    });

    res.json(resultados);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro ao buscar dados." });
  }
});

export default router;
