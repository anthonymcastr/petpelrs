import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useClienteStore } from "../context/ClienteContext";

type Pedido = { id: number; status: string; criadoEm: string; petshop: { nome: string }; servicosJson: string; resposta?: string | null; avaliacaoNota?: number | null };
const nomes: Record<string, string> = { SOLICITACAO_ABERTA: "Solicitação em aberto", SERVICO_AGENDADO: "Serviço agendado", FINALIZADO: "Finalizado", CANCELADO: "Cancelado" };
const cores: Record<string, string> = { SOLICITACAO_ABERTA: "bg-sky-100 text-sky-800", SERVICO_AGENDADO: "bg-amber-100 text-amber-800", FINALIZADO: "bg-emerald-100 text-emerald-800", CANCELADO: "bg-red-100 text-red-800" };

export default function MeusOrcamentos() {
  const { cliente } = useClienteStore();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [notas, setNotas] = useState<Record<number, number>>({});
  const [comentarios, setComentarios] = useState<Record<number, string>>({});
  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => { if (cliente?.token) fetch(`${apiUrl}/orcamentos/cliente`, { headers: { Authorization: `Bearer ${cliente.token}` } }).then((res) => res.json()).then(setPedidos).catch(() => toast.error("Erro ao carregar pedidos")); }, [apiUrl, cliente?.token]);

  async function avaliar(pedido: Pedido) {
    const nota = notas[pedido.id];
    if (!nota) return toast.error("Escolha uma nota de 1 a 5");
    const res = await fetch(`${apiUrl}/orcamentos/${pedido.id}/avaliacao`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${cliente?.token}` }, body: JSON.stringify({ nota, comentario: comentarios[pedido.id] }) });
    const dados = await res.json();
    if (!res.ok) return toast.error(dados.erro || "Erro ao avaliar");
    toast.success("Avaliação enviada");
    setPedidos((atual) => atual.map((item) => item.id === pedido.id ? { ...item, avaliacaoNota: nota } : item));
  }

  return <main className="mx-auto min-h-[70vh] max-w-5xl bg-slate-50 px-4 py-8"><h1 className="text-3xl font-black text-slate-900">Meus pedidos de orçamento</h1><div className="mt-6 grid gap-4">{pedidos.length === 0 ? <p className="rounded-2xl bg-white p-6 text-slate-500">Nenhum pedido encontrado.</p> : pedidos.map((pedido) => <article key={pedido.id} className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><div className="flex flex-wrap justify-between gap-3"><div><h2 className="text-xl font-bold">{pedido.petshop.nome}</h2><p className="text-sm text-slate-500">{new Date(pedido.criadoEm).toLocaleString()}</p></div><span className={`rounded-full px-3 py-1 text-sm font-semibold ${cores[pedido.status] || "bg-slate-100 text-slate-700"}`}>{nomes[pedido.status] || pedido.status}</span></div><ul className="mt-4 list-disc pl-5 text-sm text-slate-600">{(JSON.parse(pedido.servicosJson) as { nome: string }[]).map((servico) => <li key={servico.nome}>{servico.nome}</li>)}</ul>{pedido.resposta && <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">Resposta: {pedido.resposta}</p>}{pedido.status === "FINALIZADO" && !pedido.avaliacaoNota && <div className="mt-4 border-t pt-4"><p className="text-sm font-semibold">Avalie a petshop</p><div className="mt-2 flex gap-1">{[1, 2, 3, 4, 5].map((nota) => <button key={nota} type="button" onClick={() => setNotas({ ...notas, [pedido.id]: nota })} className={`text-2xl ${notas[pedido.id] >= nota ? "text-amber-400" : "text-slate-300"}`}>★</button>)}</div><textarea className="mt-2 w-full rounded-xl border p-2 text-sm" placeholder="Comentário opcional" value={comentarios[pedido.id] || ""} onChange={(e) => setComentarios({ ...comentarios, [pedido.id]: e.target.value })} /><button onClick={() => avaliar(pedido)} className="mt-2 rounded-xl bg-blue-900 px-4 py-2 text-sm font-semibold text-white">Enviar avaliação</button></div>}{pedido.avaliacaoNota && <p className="mt-4 text-amber-500">Sua avaliação: {"★".repeat(pedido.avaliacaoNota)}</p>}</article>)}</div></main>;
}
