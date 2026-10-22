// Prepara a foto escolhida pelo usuário antes do envio:
// corrige a rotação, reduz o tamanho e converte para JPEG.
// Fotos de celular costumam ter 5 a 10 MB; o servidor aceita até 4 MB.

const LADO_MAXIMO = 1600;
const LIMITE_BYTES = 3.5 * 1024 * 1024;
const ENTRADA_MAXIMA = 30 * 1024 * 1024;

async function abrirImagem(arquivo: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(arquivo, { imageOrientation: "from-image" });
  } catch {
    // Navegadores mais antigos não aceitam as opções
    return await createImageBitmap(arquivo);
  }
}

function paraBlob(canvas: HTMLCanvasElement, qualidade: number) {
  return new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", qualidade),
  );
}

export async function prepararFoto(arquivo: File): Promise<File> {
  const pareceImagem =
    arquivo.type.startsWith("image/") ||
    /\.(jpe?g|png|webp|heic|heif)$/i.test(arquivo.name);

  if (!pareceImagem) {
    throw new Error("Escolha um arquivo de imagem (JPG, PNG ou WebP).");
  }
  if (arquivo.size > ENTRADA_MAXIMA) {
    throw new Error("A imagem é grande demais (máximo de 30 MB).");
  }

  let imagem: ImageBitmap;
  try {
    imagem = await abrirImagem(arquivo);
  } catch {
    throw new Error(
      "Não foi possível ler essa imagem. Tente uma foto em JPG ou PNG.",
    );
  }

  const escala = Math.min(1, LADO_MAXIMO / Math.max(imagem.width, imagem.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(imagem.width * escala);
  canvas.height = Math.round(imagem.height * escala);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    imagem.close();
    throw new Error("Seu navegador não conseguiu processar a imagem.");
  }

  // Fundo branco: PNG com transparência viraria preto ao converter para JPEG
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(imagem, 0, 0, canvas.width, canvas.height);
  imagem.close();

  let blob: Blob | null = null;
  for (const qualidade of [0.85, 0.75, 0.65, 0.5]) {
    blob = await paraBlob(canvas, qualidade);
    if (blob && blob.size <= LIMITE_BYTES) break;
  }

  if (!blob || blob.size > LIMITE_BYTES) {
    throw new Error("Não foi possível reduzir essa imagem. Tente outra foto.");
  }

  const nomeBase = arquivo.name.replace(/\.[^.]+$/, "") || "foto";
  return new File([blob], `${nomeBase}.jpg`, { type: "image/jpeg" });
}

export function tamanhoLegivel(bytes: number) {
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}