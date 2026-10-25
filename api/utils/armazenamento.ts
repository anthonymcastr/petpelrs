import { v2 as cloudinary } from "cloudinary"
import { Readable } from "node:stream"
import type { TipoImagem } from "./uploadFoto"

const cloudinaryConfigurado = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET,
)

if (cloudinaryConfigurado) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })
}

export type ImagemArmazenada = { url: string; publicId: string }

export async function enviarImagem(buffer: Buffer, tipo: TipoImagem): Promise<ImagemArmazenada> {
  if (!cloudinaryConfigurado) {
    throw new Error("Cloudinary não configurado. Defina CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY e CLOUDINARY_API_SECRET.")
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "petpel/animais", resource_type: "image", format: tipo.split("/")[1] },
      (erro, resultado) => {
        if (erro || !resultado) return reject(erro || new Error("Cloudinary não retornou a imagem"))
        resolve({ url: resultado.secure_url, publicId: resultado.public_id })
      },
    )
    Readable.from(buffer).pipe(stream)
  })
}

export async function removerImagens(publicIds: string[]) {
  if (!cloudinaryConfigurado || publicIds.length === 0) return
  await Promise.allSettled(publicIds.map((publicId) => cloudinary.uploader.destroy(publicId, { resource_type: "image" })))
}
