import { create } from "zustand";
import { persist } from "zustand/middleware";

type PetshopSessao = {
  id: number;
  nome: string;
  email: string;
  role: "petshop";
  token: string;
};
type PetshopStore = {
  petshop: PetshopSessao | null;
  entrar: (petshop: PetshopSessao) => void;
  sair: () => void;
};

export const usePetshopStore = create<PetshopStore>()(
  persist(
    (set) => ({
      petshop: null,
      entrar: (petshop) => set({ petshop }),
      sair: () => set({ petshop: null }),
    }),
    { name: "petshop-storage" },
  ),
);
