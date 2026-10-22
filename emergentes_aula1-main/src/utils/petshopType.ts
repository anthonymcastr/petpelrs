export type ServicoType = {
  id: number;
  nome: string;
  descricao?: string | null;
  // null = "sob consulta"
  preco?: number | null;
};

export type PetshopType = {
  id: number;
  nome: string;
  descricao?: string | null;
  logoUrl?: string | null;
  endereco?: string | null;
  horario?: string | null;
  diasFuncionamento?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  // Só números, com DDI e DDD (ex: 5553991234567)
  whatsapp: string;
  avaliacaoMedia?: number;
  totalAvaliacoes?: number;
  servicos: ServicoType[];
};