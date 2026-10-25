import multer from "multer"
import type { NextFunction, Request, Response } from "express"

export const LIMITE_FOTO_BYTES = 4 * 1024 * 1024
export const MAX_FOTOS = 6

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: LIMITE_FOTO_BYTES, files: MAX_FOTOS },
})

const uploadLogo = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: LIMITE_FOTO_BYTES, files: 1 },
})

export function receberFotos(req: Request, res: Response, next: NextFunction) {
  upload.array("fotos", MAX_FOTOS)(req, res, (erro: unknown) => {
    if (!erro) return next()

    if (erro instanceof multer.MulterError) {
      if (erro.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ erro: "A foto é grande demais. Use uma imagem de até 4 MB." })
      }
      if (erro.code === "LIMIT_FILE_COUNT" || erro.code === "LIMIT_UNEXPECTED_FILE") {
        return res.status(400).json({ erro: `Envie no máximo ${MAX_FOTOS} fotos.` })
      }
    }

    console.error("Erro ao receber fotos:", erro)
    return res.status(400).json({ erro: "Não foi possível ler as fotos enviadas." })
  })
}

export function receberLogo(req: Request, res: Response, next: NextFunction) {
  uploadLogo.single("logo")(req, res, (erro: unknown) => {
    if (!erro) return next()

    if (erro instanceof multer.MulterError && erro.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ erro: "A imagem é grande demais. Use uma imagem de até 4 MB." })
    }

    console.error("Erro ao receber logo:", erro)
    return res.status(400).json({ erro: "Não foi possível ler a imagem enviada." })
  })
}

export function fotosRecebidas(req: Request): Express.Multer.File[] {
  return Array.isArray(req.files) ? req.files : []
}

export function logoRecebida(req: Request): Express.Multer.File | undefined {
  return req.file
}

export type TipoImagem = "image/jpeg" | "image/png" | "image/webp"

export function tipoDaImagem(buffer: Buffer): TipoImagem | null {
  if (buffer.length > 12 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg"
  if (buffer.length > 12 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return "image/png"
  if (buffer.length > 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") return "image/webp"
  return null
}
