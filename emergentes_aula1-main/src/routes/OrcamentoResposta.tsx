import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";

type Orcamento = {
  petshop: { nome: string };
  cliente: { nome: string };
  servicosJson: string;
  observacao?: string | null;
  status: "PENDENTE" | "RESPONDIDO";
  resposta?: string | null;
};

export default function OrcamentoResposta() {
  const { token } = useParams();
  const [orcamento, setOrcamento] = useState<Orcamento | null>(null);
  const [resposta, setResposta] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetch(`${apiUrl}/orcamentos/responder/${token}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Orçamento não encontrado");
        setOrcamento(await res.json());
      })
      .catch((error) => toast.error(error.message))
      .finally(() => setCarregando(false));
  }, [apiUrl, token]);

  async function enviarResposta() {
    if (resposta.trim().length < 2) {
      toast.error("Digite uma resposta");
      return;
    }

    try {
      setEnviando(true);
      const res = await fetch(`${apiUrl}/orcamentos/responder/${token}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resposta: resposta.trim() }),
      });
      const dados = await res.json();
      if (!res.ok) throw new Error(dados.erro || "Erro ao enviar resposta");
      setOrcamento((atual) => atual ? { ...atual, status: "RESPONDIDO", resposta: dados.resposta } : atual);
      toast.success("Resposta enviada ao cliente");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao responder orçamento");
    } finally {
      setEnviando(false);
    }
  }

  if (carregando) return <p className="p-8 text-center">Carregando orçamento...</p>;
  if (!orcamento) return <p className="p-8 text-center">Orçamento não encontrado.</p>;

  const servicos = JSON.parse(orcamento.servicosJson) as { nome: string; preco?: number | null }[];

  return (
    <main className="mx-auto min-h-[70vh] max-w-2xl px-4 py-10">
      <section className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200 md:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-700">PetPel RS</p>
        <h1 className="mt-2 text-3xl font-black text-slate-900">Responder orçamento</h1>
        <p className="mt-2 text-slate-600">Cliente: {orcamento.cliente.nome}</p>
        <p className="font-semibold text-slate-900">Petshop: {orcamento.petshop.nome}</p>

        <ul className="mt-6 space-y-2 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
          {servicos.map((servico) => <li key={servico.nome}>{servico.nome}</li>)}
        </ul>

        {orcamento.observacao && <p className="mt-4 text-sm text-slate-600">Observação: {orcamento.observacao}</p>}

        {orcamento.status === "RESPONDIDO" ? (
          <div className="mt-6 rounded-2xl bg-emerald-50 p-4 text-emerald-800">
            <strong>Resposta enviada:</strong>
            <p className="mt-2 whitespace-pre-wrap">{orcamento.resposta}</p>
          </div>
        ) : (
          <div className="mt-6">
            <label className="text-sm font-semibold text-slate-700">
              Sua resposta
              <textarea
                value={resposta}
                onChange={(event) => setResposta(event.target.value)}
                rows={5}
                className="mt-2 w-full resize-none rounded-2xl border border-slate-300 p-3 font-normal outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                placeholder="Informe valores, horários e orientações para o cliente."
              />
            </label>
            <button
              type="button"
              onClick={enviarResposta}
              disabled={enviando}
              className="mt-4 w-full rounded-xl bg-blue-900 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
            >
              {enviando ? "Enviando..." : "Enviar resposta"}
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
