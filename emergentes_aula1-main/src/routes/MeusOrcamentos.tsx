import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useClienteStore } from "../context/ClienteContext";
import { OrcamentoStatus, ServicosOrcamento } from "../components/OrcamentoStatus";
import { OrcamentoDetalhes } from "../components/OrcamentoDetalhes";
import { filtrarPedidos, OrcamentoFiltros, type FiltrosOrcamento } from "../components/OrcamentoFiltros";

type Pedido = { id: number; status: string; criadoEm: string; petshop: { nome: string }; servicosJson: string; observacao?: string | null; resposta?: string | null; avaliacaoNota?: number | null; dataAgendamento?: string | null; horarioAgendamento?: string | null };

function dataAgendamentoFormatada(data: string) {
  return new Date(`${data}T12:00:00`).toLocaleDateString("pt-BR");
}

export default function MeusOrcamentos() {
  const { cliente } = useClienteStore();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [filtros, setFiltros] = useState<FiltrosOrcamento>({ status: "", inicio: "", fim: "" });
  const [detalhe, setDetalhe] = useState<Pedido | null>(null);
  const [notas, setNotas] = useState<Record<number, number>>({});
  const [comentarios, setComentarios] = useState<Record<number, string>>({});
  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (!cliente?.token) return;
    fetch(`${apiUrl}/orcamentos/cliente`, { headers: { Authorization: `Bearer ${cliente.token}` } }).then((res) => res.json()).then(setPedidos).catch(() => toast.error("Erro ao carregar pedidos"));
  }, [apiUrl, cliente?.token]);

  const filtrados = useMemo(() => filtrarPedidos(pedidos, filtros), [pedidos, filtros]);
  const resumo = useMemo(() => ({ total: pedidos.length, abertos: pedidos.filter((p) => p.status === "SOLICITACAO_ABERTA").length, agendados: pedidos.filter((p) => p.status === "SERVICO_AGENDADO").length, finalizados: pedidos.filter((p) => p.status === "FINALIZADO").length }), [pedidos]);

  async function avaliar(pedido: Pedido) {
    const nota = notas[pedido.id];
    if (!nota) return toast.error("Escolha uma nota de 1 a 5");
    const res = await fetch(`${apiUrl}/orcamentos/${pedido.id}/avaliacao`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${cliente?.token}` }, body: JSON.stringify({ nota, comentario: comentarios[pedido.id] }) });
    const dados = await res.json();
    if (!res.ok) return toast.error(dados.erro || "Erro ao avaliar");
    toast.success("AvaliaÃ§Ã£o enviada");
    setPedidos((atual) => atual.map((item) => item.id === pedido.id ? { ...item, avaliacaoNota: nota } : item));
  }

  async function cancelar(pedido: Pedido) {
    if (!window.confirm("Deseja cancelar este agendamento? O horÃ¡rio ficarÃ¡ disponÃ­vel novamente.")) return;
    const res = await fetch(`${apiUrl}/orcamentos/${pedido.id}/cancelar`, { method: "PATCH", headers: { Authorization: `Bearer ${cliente?.token}` } });
    const dados = await res.json();
    if (!res.ok) return toast.error(dados.erro || "Erro ao cancelar agendamento");
    toast.success("Agendamento cancelado; o horÃ¡rio voltou a ficar disponÃ­vel");
    setPedidos((atual) => atual.map((item) => item.id === pedido.id ? { ...item, status: "CANCELADO" } : item));
  }

  return (
    <main className="min-h-[75vh] bg-slate-50 px-4 py-7 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="border-b border-slate-200 pb-5">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div><h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Meus orÃ§amentos</h1><p className="mt-2 text-sm text-slate-500">Acompanhe seus pedidos, respostas e avaliaÃ§Ãµes.</p></div>
            <p className="text-sm text-slate-500"><strong className="text-xl text-slate-900">{resumo.total}</strong> pedidos no total</p>
          </div>
          <dl className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-t border-slate-200 pt-4 text-sm"><div><dt className="inline text-sky-700">Abertos </dt><dd className="inline font-bold text-slate-900">{resumo.abertos}</dd></div><div><dt className="inline text-amber-700">Agendados </dt><dd className="inline font-bold text-slate-900">{resumo.agendados}</dd></div><div><dt className="inline text-emerald-700">Finalizados </dt><dd className="inline font-bold text-slate-900">{resumo.finalizados}</dd></div></dl>
        </header>

        <div className="mt-6"><OrcamentoFiltros filtros={filtros} onChange={setFiltros} total={filtrados.length} /></div>
        <div className="mt-5 space-y-5">
          {filtrados.length === 0 ? <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm"><h2 className="font-bold text-slate-900">Nenhum pedido encontrado</h2><p className="mt-2 text-sm text-slate-500">Ajuste os filtros ou envie um novo orÃ§amento para uma petshop.</p></div> : filtrados.map((pedido) => <article key={pedido.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Pedido #{pedido.id}</p><h2 className="mt-1 text-xl font-bold text-slate-900">{pedido.petshop.nome}</h2><p className="mt-1 text-sm text-slate-500">{new Date(pedido.criadoEm).toLocaleString()}</p></div><OrcamentoStatus status={pedido.status} /></div><div className="mt-5"><ServicosOrcamento servicosJson={pedido.servicosJson} /></div>{pedido.dataAgendamento && pedido.horarioAgendamento && <p className="mt-4 rounded-2xl bg-blue-50 p-4 text-sm text-blue-900"><strong>Agendamento:</strong> {dataAgendamentoFormatada(pedido.dataAgendamento)} Ã s {pedido.horarioAgendamento}</p>}{pedido.resposta && <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700"><strong>Resposta:</strong> {pedido.resposta}</p>}<div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4"><button type="button" onClick={() => setDetalhe(pedido)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Ver detalhes</button>{(pedido.status === "SERVICO_AGENDADO" || pedido.status === "SOLICITACAO_ABERTA") && <button type="button" onClick={() => cancelar(pedido)} className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">Cancelar agendamento</button>}{pedido.status === "FINALIZADO" && !pedido.avaliacaoNota && <div className="flex items-center gap-2"><div className="flex gap-0.5">{[1, 2, 3, 4, 5].map((nota) => <button key={nota} type="button" onClick={() => setNotas({ ...notas, [pedido.id]: nota })}           className={notas[pedido.id] >= nota ? "text-xl text-amber-400" : "text-xl text-slate-300"}>â˜…</button>)}</div><button type="button" onClick={() => avaliar(pedido)} className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800">Avaliar</button></div>}{pedido.avaliacaoNota && <span className="text-sm text-amber-500">{"â˜…".repeat(pedido.avaliacaoNota)}</span>}</div></article>)}
        </div>
      </div>
      {detalhe && <OrcamentoDetalhes pedido={detalhe} fechar={() => setDetalhe(null)} />}
    </main>
  );
}
