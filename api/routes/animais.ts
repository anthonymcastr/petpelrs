import { PrismaClient, TipoAnimal } from "@prisma/client"
import { Router } from "express"
import { z, ZodError } from "zod"
import { autentica, AuthRequest } from "../middleware/autentica"
import { enviarEmail } from "../utils/email"
import { verificaImagemSegura } from "../utils/safeSearch"

const prisma = new PrismaClient()
const router = Router()

// ========================
// Schema de validação
// ========================
const animalSchema = z.object({
  nome: z.string().min(2, { message: "Nome deve possuir, no mínimo, 2 caracteres" }),
  idade: z.number().min(0, { message: "Idade deve ser um número positivo" }),
  raca: z.string().min(2, { message: "Espécie deve possuir, no mínimo, 2 caracteres" }),
  urlImagem: z.string().min(5, { message: "URL da imagem deve possuir, no mínimo, 5 caracteres" }),
  tipo: z.enum(["ADOCAO", "PERDIDO", "ENCONTRADO"]),
  cidade: z.enum(["PELOTAS"]),
  usuarioId: z.number().min(1, { message: "ID do usuário deve ser um número positivo" }),
  chip: z.string().optional().nullable(),
  endereco: z.string().optional().nullable()
})

// Devolve só o texto do primeiro erro (o front exibe esse texto na tela)
function primeiroErro(erro: ZodError) {
  return erro.errors[0]?.message ?? "Dados inválidos"
}

// ========================
// Função utilitária: normalize
// ========================
function normalize(text: string) {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase()
}

// ========================
// CHIP
// ========================
const SEM_CHIP = "Não contém"

type ChipPreparado = { ok: true; chip: string } | { ok: false; erro: string }

// Padroniza o chip: sem espaços/pontos/traços, em maiúsculas.
// Vazio ou "Não contém" => "Não contém"
function prepararChip(valor?: string | null): ChipPreparado {
  if (!valor) return { ok: true, chip: SEM_CHIP }

  const limpo = valor.replace(/[\s.\-]/g, "").toUpperCase()
  if (!limpo || normalize(limpo) === "NAOCONTEM") {
    return { ok: true, chip: SEM_CHIP }
  }

  if (!/^[A-Z0-9]{5,20}$/.test(limpo)) {
    return { ok: false, erro: "Chip inválido: use de 5 a 20 letras e números" }
  }

  return { ok: true, chip: limpo }
}

// Já existe OUTRO animal com esse chip?
async function chipEmUso(chip: string, ignorarId?: number) {
  if (chip === SEM_CHIP) return false

  const existente = await prisma.animal.findFirst({
    where: {
      chip,
      ...(ignorarId ? { NOT: { id: ignorarId } } : {}),
    },
    select: { id: true },
  })

  return !!existente
}

// ========================
// LOCALIZAÇÃO (Nominatim / OpenStreetMap)
// ========================
type Localizacao = {
  endereco: string | null
  latitude: number | null
  longitude: number | null
}

class EnderecoNaoEncontrado extends Error {}

// ~100 m de precisão: não expõe o ponto exato de quem está com o animal
function arredondar(valor: number) {
  return Math.round(valor * 1000) / 1000
}

async function resolverLocalizacao(enderecoBruto?: string | null): Promise<Localizacao> {
  const endereco = enderecoBruto?.trim()
  if (!endereco) return { endereco: null, latitude: null, longitude: null }

  const consulta = `${endereco}, Pelotas, RS, Brasil`
  // Caixa em volta de Pelotas (esquerda, topo, direita, base)
  const viewbox = "-52.60,-31.55,-52.05,-32.05"

  const url =
    "https://nominatim.openstreetmap.org/search" +
    `?format=json&limit=1&countrycodes=br&bounded=1&viewbox=${viewbox}` +
    `&q=${encodeURIComponent(consulta)}`

  const resp = await fetch(url, {
    headers: {
      "User-Agent": "PetPelRS/1.0 (https://petpelrs.com.br)",
      "Accept-Language": "pt-BR",
    },
    signal: AbortSignal.timeout(8000),
  })

  if (!resp.ok) throw new Error(`Nominatim respondeu ${resp.status}`)

  const dados = (await resp.json()) as Array<{ lat: string; lon: string }>

  if (!dados.length) {
    throw new EnderecoNaoEncontrado(
      "Não encontramos esse endereço em Pelotas. Confira a rua e o bairro."
    )
  }

  return {
    endereco,
    latitude: arredondar(parseFloat(dados[0].lat)),
    longitude: arredondar(parseFloat(dados[0].lon)),
  }
}

// ========================
// INCLUDE USUARIO PADRÃO
// ========================
const includeUsuario = {
  usuario: {
    select: {
      id: true,
      nome: true,
      email: true,
    },
  },
}

// ========================
// GET - TODOS OS ANIMAIS
// ========================
router.get("/", async (req, res) => {
  try {
    const animais = await prisma.animal.findMany({ include: includeUsuario })
    res.status(200).json(animais)
  } catch (error) {
    console.error(error)
    res.status(500).json({ erro: "Erro ao buscar animais" })
  }
})

// ========================
// GET - PESQUISA POR TERMO (nome, raça ou chip)
// ========================
router.get("/pesquisa", async (req, res) => {
  const termo = (req.query.termo as string)?.trim()
  if (!termo) return res.status(400).json({ erro: "O termo de busca é obrigatório" })

  // Chips são guardados em maiúsculas e sem separadores
  const termoChip = termo.replace(/[\s.\-]/g, "").toUpperCase()

  try {
    const resultados = await prisma.animal.findMany({
      where: {
        OR: [
          { nome: { contains: termo, mode: "insensitive" } },
          { raca: { contains: termo, mode: "insensitive" } },
          ...(termoChip.length >= 4 ? [{ chip: { contains: termoChip } }] : []),
        ],
      },
      include: includeUsuario,
    })

    // Filtra animais sem usuário (só por precaução)
    const resultadosComUsuario = resultados.filter((a) => a.usuario !== null)
    res.status(200).json(resultadosComUsuario)
  } catch (error) {
    console.error(error)
    res.status(500).json({ erro: "Erro ao buscar dados" })
  }
})

// ========================
// GET - ANIMAL POR ID
// ========================
router.get("/:id", async (req, res) => {
  const { id } = req.params
  try {
    const animal = await prisma.animal.findUnique({
      where: { id: Number(id) },
      include: includeUsuario,
    })

    if (!animal) return res.status(404).json({ erro: "Animal não encontrado" })

    res.status(200).json(animal)
  } catch (error) {
    console.error(error)
    res.status(500).json({ erro: "Erro ao buscar animal" })
  }
})

// ========================
// POST - CRIAR ANIMAL
// ========================
router.post("/", async (req, res) => {
  // LOG da URL recebida
  if (req.body && req.body.urlImagem) {
    console.log("URL da imagem recebida:", req.body.urlImagem)
  } else {
    console.log("Nenhuma urlImagem recebida no body!")
  }

  const valida = animalSchema.safeParse(req.body)
  if (!valida.success) return res.status(400).json({ erro: primeiroErro(valida.error) })

  const { nome, idade, raca, urlImagem, tipo, cidade, usuarioId, chip, endereco } = valida.data

  // Chip: padroniza e confere se já existe
  const chipPreparado = prepararChip(chip)
  if (!chipPreparado.ok) return res.status(400).json({ erro: chipPreparado.erro })

  try {
    if (await chipEmUso(chipPreparado.chip)) {
      return res.status(409).json({ erro: "Já existe um animal cadastrado com esse chip." })
    }
  } catch (error) {
    console.error(error)
    return res.status(500).json({ erro: "Erro ao verificar o chip" })
  }

  // Verificação automática de imagem imprópria
  try {
    const imagemSegura = await verificaImagemSegura(urlImagem)
    if (!imagemSegura) {
      console.log("Imagem bloqueada pelo safeSearch!")
      return res.status(400).json({ erro: "Falha ao cadastrar animal. São permitidas apenas fotos de animais no nosso sistema. Agradecemos a compreensão." })
    } else {
      console.log("Imagem passou pelo safeSearch!")
    }
  } catch (err) {
    console.error("Erro ao verificar imagem no Sightengine:", err)
    return res.status(500).json({ erro: "Erro ao verificar imagem. Tente novamente mais tarde." })
  }

  // Localização: endereço não encontrado => erro; serviço fora do ar => segue sem localização
  let localizacao: Localizacao = { endereco: null, latitude: null, longitude: null }
  try {
    localizacao = await resolverLocalizacao(endereco)
  } catch (err) {
    if (err instanceof EnderecoNaoEncontrado) {
      return res.status(400).json({ erro: err.message })
    }
    console.warn("Serviço de geolocalização indisponível, cadastrando sem localização:", err)
  }

  try {
    const animal = await prisma.animal.create({
      data: {
        nome,
        idade,
        raca,
        urlImagem,
        tipo,
        cidade,
        usuarioId,
        chip: chipPreparado.chip,
        ...localizacao,
      },
      include: includeUsuario,
    })
    console.log("Animal cadastrado com sucesso:", animal)

    // 📧 Email de confirmação de cadastro
    if (animal.usuario?.email) {
      const tipoTexto = tipo === "ADOCAO" ? "para adoção" : tipo === "PERDIDO" ? "perdido" : "encontrado"
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style=\"color: #1e3a8a;\">🐾 Cadastro realizado com sucesso!</h2>
          <p>Olá, <strong>${animal.usuario.nome}</strong>!</p>
          <p>Seu pet <strong>${nome}</strong> foi cadastrado com sucesso na plataforma PetPel.</p>
          <div style=\"background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;\">
            <p><strong>Detalhes do cadastro:</strong></p>
            <ul style=\"list-style: none; padding: 0;\">
              <li>🐶 <strong>Nome:</strong> ${nome}</li>
              <li>📍 <strong>Tipo:</strong> ${tipoTexto}</li>
              <li>🐾 <strong>Raça:</strong> ${raca}</li>
              <li>🎂 <strong>Idade:</strong> ${idade} anos</li>
              <li>🏙️ <strong>Cidade:</strong> ${cidade}</li>
              <li>🔖 <strong>Chip:</strong> ${animal.chip}</li>
            </ul>
          </div>
          <p>Agora outras pessoas poderão visualizar e entrar em contato sobre o ${nome}.</p>
          <p style=\"color: #6b7280; font-size: 12px;\">Equipe PetPel RS</p>
        </div>
      `

      try {
        await enviarEmail(
          animal.usuario.email,
          `✅ ${nome} cadastrado com sucesso no PetPel`,
          html
        )
      } catch (err) {
        console.warn("Erro ao enviar e-mail de confirmação:", err)
      }
    }

    res.status(201).json(animal)
  } catch (error) {
    console.error(error)
    res.status(400).json({ erro: "Erro ao criar animal" })
  }
})

// ========================
// PUT - ATUALIZAR ANIMAL
// ========================
router.put("/:id", autentica, async (req: AuthRequest, res) => {
  const { id } = req.params
  const valida = animalSchema.safeParse(req.body)
  if (!valida.success) return res.status(400).json({ erro: primeiroErro(valida.error) })

  const { nome, idade, raca, urlImagem, tipo, cidade, usuarioId, chip, endereco } = valida.data

  try {
    const animal = await prisma.animal.findUnique({ where: { id: Number(id) } })
    if (!animal) return res.status(404).json({ erro: "Animal não encontrado" })

    if (req.user?.role !== "admin" && animal.usuarioId !== req.user?.id) {
      return res.status(403).json({ erro: "Você não tem permissão para editar este animal" })
    }

    // Chip: só altera se veio no corpo da requisição
    let dadosChip: { chip?: string } = {}
    if (chip !== undefined) {
      const chipPreparado = prepararChip(chip)
      if (!chipPreparado.ok) return res.status(400).json({ erro: chipPreparado.erro })

      if (await chipEmUso(chipPreparado.chip, animal.id)) {
        return res.status(409).json({ erro: "Já existe um animal cadastrado com esse chip." })
      }
      dadosChip = { chip: chipPreparado.chip }
    }

    // Localização: só recalcula se o endereço veio no corpo da requisição
    let dadosLocalizacao: Partial<Localizacao> = {}
    if (endereco !== undefined) {
      try {
        dadosLocalizacao = await resolverLocalizacao(endereco)
      } catch (err) {
        if (err instanceof EnderecoNaoEncontrado) {
          return res.status(400).json({ erro: err.message })
        }
        console.warn("Serviço de geolocalização indisponível, mantendo localização atual:", err)
      }
    }

    const atualizado = await prisma.animal.update({
      where: { id: Number(id) },
      data: { nome, idade, raca, urlImagem, tipo, cidade, usuarioId, ...dadosChip, ...dadosLocalizacao },
      include: includeUsuario,
    })

    res.status(200).json(atualizado)
  } catch (error) {
    console.error(error)
    res.status(400).json({ erro: "Erro ao atualizar animal" })
  }
})

// ========================
// DELETE - EXCLUIR ANIMAL (admin)
// ========================
router.delete("/:id", autentica, async (req: AuthRequest, res) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ erro: "Apenas administradores podem excluir animais" })
  }

  try {
    await prisma.animal.delete({ where: { id: Number(req.params.id) } })
    res.status(200).json({ mensagem: "Animal excluído com sucesso" })
  } catch (error) {
    console.error(error)
    res.status(400).json({ erro: "Erro ao excluir animal" })
  }
})

// ========================
// POST - CRIAR VÁRIOS ANIMAIS (bulk)
// ========================
router.post("/bulk", async (req, res) => {
  const animais = req.body
  try {
    const resultado = await prisma.animal.createMany({
      data: animais,
      skipDuplicates: true,
    })
    res.status(201).json(resultado)
  } catch (error) {
    console.error(error)
    res.status(500).json({ erro: "Erro ao criar animais" })
  }
})

// ========================
// GET - RESUMO TIPOS
// ========================
router.get("/animais/resumo", async (req, res) => {
  try {
    const adocao = await prisma.animal.count({ where: { tipo: TipoAnimal.ADOCAO } })
    const perdido = await prisma.animal.count({ where: { tipo: TipoAnimal.PERDIDO } })
    const encontrado = await prisma.animal.count({ where: { tipo: TipoAnimal.ENCONTRADO } })

    res.json({ adocao, perdido, encontrado })
  } catch (error) {
    console.error(error)
    res.status(500).json({ erro: "Erro ao buscar resumo" })
  }
})

export default router