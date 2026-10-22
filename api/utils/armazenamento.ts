import crypto from "node:crypto"

// Guarda a foto no Cloudinary e devolve a URL pública (https).
// A Vercel não mantém arquivos em disco, por isso a imagem precisa ir para um serviço externo.
// Variáveis: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
export async function enviarImagem(imagem: Buffer, mimetype: string): Promise<string> {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!cloud || !apiKey || !apiSecret) {
    throw new Error("Cloudinary não configurado (CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET)")
  }

  const timestamp = Math.floor(Date.now() / 1000)
  const folder = "petpelrs/animais"

  // Assinatura: parâmetros em ordem alfabética + segredo
  const signature = crypto
    .createHash("sha1")
    .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
    .digest("hex")

  const form = new FormData()
  form.append("file", new Blob([new Uint8Array(imagem)], { type: mimetype }), "foto")
  form.append("api_key", apiKey)
  form.append("timestamp", String(timestamp))
  form.append("folder", folder)
  form.append("signature", signature)

  const resposta = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, {
    method: "POST",
    body: form,
    signal: AbortSignal.timeout(20000),
  })

  const dados: any = await resposta.json().catch(() => ({}))

  if (!resposta.ok || !dados.secure_url) {
    throw new Error(`Cloudinary falhou: ${dados?.error?.message ?? resposta.status}`)
  }

  return dados.secure_url as string
}
