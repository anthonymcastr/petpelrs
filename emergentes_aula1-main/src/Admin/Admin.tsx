import { useEffect, useState } from "react";
import { VictoryPie } from "victory";

type ResumoAdmin = {
  totalClientes: number;
  totalAnimais: number;
  totalContatos: number;
};

type ResumoAnimais = {
  adocao: number;
  perdido: number;
  encontrado: number;
};

export default function Admin() {
  const [resumoAdmin, setResumoAdmin] = useState<ResumoAdmin | null>(null);
  const [resumoAnimais, setResumoAnimais] = useState<ResumoAnimais | null>(
    null,
  );
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregarDashboard() {
      try {
        const [resumoRes, animaisRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/admins`),
          fetch(
            "https://emergentes-aula1-main-6evg.vercel.app/animais/animais/resumo",
          ),
        ]);

        if (!resumoRes.ok) {
          throw new Error("Falha ao carregar resumo do admin");
        }

        if (!animaisRes.ok) {
          throw new Error("Falha ao carregar resumo de animais");
        }

        const resumoDados: ResumoAdmin = await resumoRes.json();
        const animaisDados: ResumoAnimais = await animaisRes.json();

        setResumoAdmin(resumoDados);
        setResumoAnimais(animaisDados);
      } catch (erro) {
        console.error("Erro ao buscar dados da dashboard:", erro);
      } finally {
        setCarregando(false);
      }
    }

    carregarDashboard();
  }, []);

  const data = resumoAnimais
    ? [
        { x: "Adoção", y: resumoAnimais.adocao },
        { x: "Perdidos", y: resumoAnimais.perdido },
        { x: "Encontrados", y: resumoAnimais.encontrado },
      ]
    : [];

  const cards = [
    {
      label: "Usuários cadastrados",
      value: resumoAdmin?.totalClientes ?? 0,
      description: "Total de contas ativas na plataforma",
      accent: "from-sky-500 to-cyan-400",
    },
    {
      label: "Mensagens trocadas",
      value: resumoAdmin?.totalContatos ?? 0,
      description: "Quantidade total de contatos enviados",
      accent: "from-emerald-500 to-lime-400",
    },
    {
      label: "Animais cadastrados",
      value: resumoAdmin?.totalAnimais ?? 0,
      description: "Cadastros disponíveis no sistema",
      accent: "from-amber-500 to-orange-400",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100/80 px-4 py-6 sm:px-6 lg:px-10">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="rounded-3xl bg-slate-900 px-6 py-7 text-white shadow-xl shadow-slate-300/60 sm:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300">
            Painel administrativo
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
            Dashboard geral
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-300 sm:text-base">
            Resumo rápido da operação com os principais totais da plataforma.
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <article
              key={card.label}
              className="overflow-hidden rounded-2xl border border-white/70 bg-white p-5 shadow-sm"
            >
              <div
                className={`h-1.5 w-20 rounded-full bg-gradient-to-r ${card.accent}`}
              />
              <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
                {card.label}
              </p>
              <div className="mt-2 flex items-end justify-between gap-4">
                <strong className="text-4xl font-black text-slate-900">
                  {carregando ? "--" : card.value}
                </strong>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                  Soma total
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {card.description}
              </p>
            </article>
          ))}
        </section>

        <section className="grid gap-6">
          <article className="rounded-3xl border border-white/70 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">
                  Distribuição
                </p>
                <h2 className="mt-2 text-2xl font-black text-slate-900">
                  Status dos animais
                </h2>
              </div>
            </div>

            {resumoAnimais ? (
              <div className="flex flex-col items-center gap-4">
                <div className="mx-auto flex h-40 w-40 items-center justify-center overflow-hidden">
                  <VictoryPie
                    data={data}
                    colorScale={["#86efac", "#fde68a", "#fca5a5"]}
                    style={{
                      data: {
                        stroke: "#fff",
                        strokeWidth: 2,
                      },
                    }}
                    innerRadius={10}
                    height={120}
                    width={120}
                    padding={0}
                  />
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-slate-600">
                  <span className="flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5">
                    <span className="h-3 w-3 rounded-full bg-[#86efac]" />
                    Adoção: {resumoAnimais.adocao}
                  </span>
                  <span className="flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5">
                    <span className="h-3 w-3 rounded-full bg-[#fde68a]" />
                    Perdidos: {resumoAnimais.perdido}
                  </span>
                  <span className="flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5">
                    <span className="h-3 w-3 rounded-full bg-[#fca5a5]" />
                    Encontrados: {resumoAnimais.encontrado}
                  </span>
                </div>
              </div>
            ) : (
              <p className="py-10 text-center text-sm text-slate-500">
                {carregando
                  ? "Carregando gráfico..."
                  : "Sem dados disponíveis."}
              </p>
            )}
          </article>
        </section>
      </main>
    </div>
  );
}
