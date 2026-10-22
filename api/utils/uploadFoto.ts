import multer from "multer"
import type { NextFunction, Request, Response } from "express"

// A Vercel recusa corpos acima de ~4,5 MB; o front já reduz a foto antes de enviar.
export const LIMITE_FOTO_BYTES = 4 * 1024 * 1024

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: LIMITE_FOTO_BYTES, files: 1 },
})

// Recebe UMA foto no campo "foto" (multipart/form-data) e devolve erros em português.
export function receberFoto(req: Request, res: Response, next: NextFunction) {
  upload.single("foto")(req, res, (erro: unknown) => {
    if (!erro) return next()

    if (erro instanceof multer.MulterError) {
      if (erro.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ erro: "A foto é grande demais. Use uma imagem de até 4 MB." })
      }
      if (erro.code === "LIMIT_UNEXPECTED_FILE") {
        return res.status(400).json({ erro: "Envie uma única foto." })
      }
    }

    console.error("Erro ao receber a foto:", erro)
    return res.status(400).json({ erro: "Não foi possível ler a foto enviada." })
  })
}

export type TipoImagem = "image/jpeg" | "image/png" | "image/webp"

// Confere o conteúdo real do arquivo (o mimetype enviado pelo navegador pode ser falso)
export function tipoDaImagem(b: Buffer): TipoImagem | null {
  if (b.length > 12 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg"
  if (
    b.length > 12 &&
    b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47
  ) return "image/png"
  if (
    b.length > 12 &&
    b.toString("ascii", 0, 4) === "RIFF" &&
    b.toString("ascii", 8, 12) === "WEBP"
  ) return "image/webp"
  return null
}
