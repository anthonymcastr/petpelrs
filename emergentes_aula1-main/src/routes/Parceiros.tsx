import { useEffect, useMemo, useState } from "react";
import type { PetshopType } from "../utils/petshopType";
import { CardPetshop } from "../components/CardPetShop";

export default function Parceiros() {
  const [petshops, setPetshops] = useState<PetshopType[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);
  const [busca, setBusca] = useState("");

  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    async function buscar() {
      try {
        const res = await fetch(`${apiUrl}/petshops`);
        if (!res.ok) throw new Error("Erro ao buscar petshops");
        setPetshops(await res.json());
      } catch (err) {
        console.error(err);
        setErro(true);
      } finally {
        setCarregando(false);
      }
    }
    buscar();
  }, [apiUrl]);

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return petshops;
    return petshops.filter((p) => p.nome.toLowerCase().includes(termo));
  }, [petshops, busca]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Topo */}
      <header className="relative overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-blue-700 px-4 pb-14 pt-12 text-center text-white">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-amber-300/10 blur-3xl" />

        <div className="relative mx-auto max-w-3xl">
          <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
            Lojas parceiras
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-blue-100 md:text-lg">
            Escolha uma loja, marque os serviços que você precisa e envie o
            pedido direto pelo WhatsApp.
          </p>

          {petshops.length > 0 && (
            <div className="mx-auto mt-8 max-w-xl rounded-3xl bg-white/10 p-2 ring-1 ring-white/20 backdrop-blur">
              <input
                type="search"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar loja pelo nome"
                aria-label="Buscar loja pelo nome"
                className="w-full rounded-2xl border-0 bg-white px-5 py-4 text-sm text-slate-900 shadow-inner placeholder:text-slate-400 focus:outline-2 focus:outline-offset-2 focus:outline-blue-300"
              />
            </div>
          )}
        </div>
      </header>

      {/* Lista */}
      <section className="mx-auto max-w-7xl px-4 py-10 md:px-8">
        {carregando ? (
          <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(260px,320px))] justify-center">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-[400px] animate-pulse rounded-3xl bg-slate-200"
              />
            ))}
          </div>
        ) : erro ? (
          <p className="py-16 text-center text-slate-500">
            Não foi possível carregar as lojas agora. Tente novamente em instantes.
          </p>
        ) : petshops.length === 0 ? (
          <p className="py-16 text-center text-slate-500">
            Em breve teremos lojas parceiras por aqui.
          </p>
        ) : filtradas.length === 0 ? (
          <p className="py-16 text-center text-slate-500">
            Nenhuma loja encontrada para essa busca.
          </p>
        ) : (
          <div className="grid justify-center gap-6 [grid-template-columns:repeat(auto-fit,minmax(260px,320px))]">
            {filtradas.map((p) => (
              <CardPetshop key={p.id} petshop={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}