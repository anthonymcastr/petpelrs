export function fotosDoAnimal(animal: { urlImagem: string; fotos?: string[] | null }): string[] {
  const fotos = (animal.fotos ?? []).filter(Boolean)
  return fotos.length > 0 ? fotos : [animal.urlImagem]
}
