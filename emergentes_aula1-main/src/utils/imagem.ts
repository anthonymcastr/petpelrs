const LADO_MAXIMO = 1600;
const LIMITE_BYTES = 600 * 1024;
const ENTRADA_MAXIMA = 30 * 1024 * 1024;

async function abrirImagem(arquivo: File): Promise<ImageBitmap> {
  try { return await createImageBitmap(arquivo, { imageOrientation: "from-image" }); }
  catch { return createImageBitmap(arquivo); }
}

function paraBlob(canvas: HTMLCanvasElement, qualidade: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", qualidade));
}

export async function prepararFoto(arquivo: File): Promise<File> {
  if (!arquivo.type.startsWith("image/") && !/\.(jpe?g|png|webp|heic|heif)$/i.test(arquivo.name)) throw new Error("Escolha um arquivo de imagem JPG, PNG ou WebP.");
  if (arquivo.size > ENTRADA_MAXIMA) throw new Error("A imagem é grande demais (máximo de 30 MB).");

  let imagem: ImageBitmap;
  try { imagem = await abrirImagem(arquivo); }
  catch { throw new Error("Não foi possível ler essa imagem. Tente JPG ou PNG."); }

  const canvas = document.createElement("canvas");
  const contexto = canvas.getContext("2d");
  if (!contexto) { imagem.close(); throw new Error("Seu navegador não conseguiu processar a imagem."); }

  const escala = Math.min(1, LADO_MAXIMO / Math.max(imagem.width, imagem.height));
  let blob: Blob | null = null;
  for (const fator of [1, 0.8, 0.65, 0.5]) {
    canvas.width = Math.max(1, Math.round(imagem.width * escala * fator));
    canvas.height = Math.max(1, Math.round(imagem.height * escala * fator));
    contexto.fillStyle = "#fff";
    contexto.fillRect(0, 0, canvas.width, canvas.height);
    contexto.drawImage(imagem, 0, 0, canvas.width, canvas.height);
    for (const qualidade of [0.85, 0.75, 0.65, 0.5]) {
      blob = await paraBlob(canvas, qualidade);
      if (blob && blob.size <= LIMITE_BYTES) break;
    }
    if (blob && blob.size <= LIMITE_BYTES) break;
  }
  imagem.close();
  if (!blob || blob.size > LIMITE_BYTES) throw new Error("Não foi possível reduzir essa imagem.");
  return new File([blob], `${arquivo.name.replace(/\.[^.]+$/, "") || "foto"}.jpg`, { type: "image/jpeg" });
}
