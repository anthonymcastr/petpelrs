import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAdminStore } from "./context/AdminContext";

type Solicitacao = {
  id: number;
  descricao: string;
  criadoEm: string;
  animal: {
    id: number;
    nome: string;
    urlImagem: string;
    tipo: string;
  };
  solicitante: {
    nome: string;
    email: string;
    telefone: string;
  };
};

export default function AdminArquivamentos() {
  const { admin } = useAdminStore();
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [respostas, setRespostas] = useState<Record<number, string>>({});
  const [processando, setProcessando] = useState<number | null>(null);
  const apiUrl = import.meta.env.VITE_API_URL;

  const carregarSolicitacoes = async () => {
    if (!admin?.token) return;

    try {
      const res = await fetch(`${apiUrl}/arquivamento/admin`, {
        headers: { Authorization: `Bearer ${admin.token}` },
      });
      const dados = await res.json();
      if (!res.ok) throw new Error(dados.erro || "Erro ao buscar solicitações");
      setSolicitacoes(dados);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao buscar solicitações",
      );
    }
  };

  useEffect(() => {
    carregarSolicitacoes();
  }, [admin?.token]);

  const analisar = async (id: number, status: "APROVADA" | "RECUSADA") => {
    const resposta = respostas[id]?.trim();
    if (!resposta || resposta.length < 2) {
      toast.error("Escreva uma resposta para o usuário");
      return;
    }

    try {
      setProcessando(id);
      const res = await fetch(`${apiUrl}/arquivamento/admin/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${admin?.token}`,
        },
        body: JSON.stringify({ status, resposta }),
      });
      const dados = await res.json();
      if (!res.ok)
        throw new Error(dados.erro || "Erro ao analisar solicitação");

      toast.success(
        status === "APROVADA" ? "Animal arquivado" : "Solicitação recusada",
      );
      setSolicitacoes((atual) => atual.filter((item) => item.id !== id));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao analisar solicitação",
      );
    } finally {
      setProcessando(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-700">
          Moderação
        </p>
        <h1 className="mt-2 text-3xl font-black text-slate-900">
          Solicitações de arquivamento
        </h1>
        <p className="mt-2 text-slate-600">
          Analise os pedidos enviados pelos responsáveis por animais
          encontrados.
        </p>
      </div>

      {solicitacoes.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          Nenhuma solicitação pendente.
        </div>
      ) : (
        <div className="grid gap-5">
          {solicitacoes.map((solicitacao) => (
            <article
              key={solicitacao.id}
              className="grid gap-5 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 md:grid-cols-[180px_1fr]"
            >
              <img
                src={solicitacao.animal.urlImagem}
                alt={solicitacao.animal.nome}
                className="h-44 w-full rounded-2xl object-cover md:h-full"
              />
              <div>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      {solicitacao.animal.nome}
                    </h2>
                    <p className="text-sm text-slate-500">
                      Solicitação de {solicitacao.solicitante.nome} ·{" "}
                      {solicitacao.solicitante.email}
                    </p>
                  </div>
                  <time className="text-xs text-slate-400">
                    {new Date(solicitacao.criadoEm).toLocaleString()}
                  </time>
                </div>

                <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                  {solicitacao.descricao}
                </div>

                <textarea
                  value={respostas[solicitacao.id] || ""}
                  onChange={(event) =>
                    setRespostas((atual) => ({
                      ...atual,
                      [solicitacao.id]: event.target.value,
                    }))
                  }
                  rows={3}
                  placeholder="Resposta para o usuário"
                  className="mt-4 w-full resize-none rounded-2xl border border-slate-300 p-3 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
                />

                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => analisar(solicitacao.id, "RECUSADA")}
                    disabled={processando === solicitacao.id}
                    className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    Recusar
                  </button>
                  <button
                    type="button"
                    onClick={() => analisar(solicitacao.id, "APROVADA")}
                    disabled={processando === solicitacao.id}
                    className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    Aprovar e arquivar
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
