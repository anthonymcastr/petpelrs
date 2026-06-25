import type { UsuarioType } from "./usuarioType"

// Tipo base sem incluir o usuário
export type AnimalBase = {
  id: number
  nome: string
  idade: number
  raca: string
  urlImagem: string
  tipo: "ADOCAO" | "ENCONTRADO" | "PERDIDO"
  cidade: string
  usuarioId: number
}

// Tipo para listagem: usuário opcional (nem sempre vem do backend)
export type Animal = AnimalBase & {
  usuario?: UsuarioType
}

// Tipo para detalhe: usuário obrigatório
export type AnimalComUsuario = AnimalBase & {
  usuario: UsuarioType
}

export type AnimalType = Animal | AnimalComUsuario

