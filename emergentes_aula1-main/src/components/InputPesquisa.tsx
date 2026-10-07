import { useState } from "react";
import type { Animal } from "../utils/animalType";

interface Props {
  setAnimais: (dados: Animal[]) => void;
}

export function InputPesquisa({ setAnimais }: Props) {
  const [termo, setTermo] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termo.trim()) return;

    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const resposta = await fetch(
        `${apiUrl}/animais/pesquisa?termo=${encodeURIComponent(termo)}`,
      );

      if (!resposta.ok) {
        throw new Error("Erro na resposta da API");
      }

      setAnimais(await resposta.json());
    } catch (error) {
      console.error("Erro ao buscar:", error);
      setAnimais([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="w-full" onSubmit={handleSubmit} role="search">
      <div className="relative">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
        <input
          type="search"
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          placeholder="Busque por nome ou raça"
          aria-label="Buscar animais por nome ou raça"
          className="w-full rounded-2xl border-0 bg-white py-4 pl-12 pr-36 text-sm text-slate-900 shadow-inner placeholder:text-slate-400 focus:outline-2 focus:outline-offset-2 focus:outline-blue-300"
        />
        <button
          type="submit"
          disabled={loading}
          className="absolute bottom-2 right-2 top-2 cursor-pointer rounded-xl bg-blue-900 px-5 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:opacity-70"
        >
          {loading ? "Buscando..." : "Pesquisar"}
        </button>
      </div>
    </form>
  );
}