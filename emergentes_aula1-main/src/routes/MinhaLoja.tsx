import { useEffect, useState } from "react";
import { toast } from "sonner";
import { usePetshopStore } from "../context/PetshopContext";

type Pedido = { id: number; status: string; criadoEm: string; cliente: { nome: string; email: string; telefone?: string }; servicosJson: string; observacao?: string | null };
const status = [{ valor: "SOLICITACAO_ABERTA", label: "Solicitação em aberto" }, { valor: "SERVICO_AGENDADO", label: "Serviço agendado" }, { valor: "FINALIZADO", label: "Finalizado" }, { valor: "CANCELADO", label: "Cancelado" }];
const cores: Record<string, string> = { SOLICITACAO_ABERTA: "border-sky-300 bg-sky-50 text-sky-900", SERVICO_AGENDADO: "border-amber-300 bg-amber-50 text-amber-900", FINALIZADO: "border-emerald-300 bg-emerald-50 text-emerald-900", CANCELADO: "border-red-300 bg-red-50 text-red-900" };

export default function MinhaLoja() {
  const { petshop } = usePetshopStore();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const apiUrl = import.meta.env.VITE_API_URL;

  async function carregar() { if (!petshop?.token) return; const res = await fetch(`${apiUrl}/orcamentos/petshop`, { headers: { Authorization: `Bearer ${petshop.token}` } }); if (res.ok) setPedidos(await res.json()); else toast.error("Erro ao carregar pedidos"); }
  useEffect(() => { carregar(); }, [petshop?.token]);

  async function mudarStatus(id: number, novoStatus: string) { const res = await fetch(`${apiUrl}/orcamentos/${id}/status`, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${petshop?.token}` }, body: JSON.stringify({ status: novoStatus }) }); const dados = await res.json(); if (!res.ok) return toast.error(dados.erro || "Erro ao alterar status"); toast.success("Status atualizado e cliente notificado"); setPedidos((atual) => atual.map((pedido) => pedido.id === id ? { ...pedido, status: novoStatus } : pedido)); }

  return <main className="mx-auto min-h-[70vh] max-w-6xl bg-slate-50 px-4 py-8"><header><p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-700">Minha loja</p><h1 className="mt-2 text-3xl font-black text-slate-900">Pedidos recebidos</h1><p className="mt-2 text-slate-600">Atualize o andamento e o cliente receberá um e-mail.</p></header><div className="mt-6 overflow-x-auto rounded-3xl bg-white shadow-sm ring-1 ring-slate-200"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-4">Cliente</th><th className="p-4">Serviços</th><th className="p-4">Data</th><th className="p-4">Status</th></tr></thead><tbody>{pedidos.map((pedido) => <tr key={pedido.id} className="border-b last:border-0"><td className="p-4"><strong>{pedido.cliente.nome}</strong><br /><span className="text-slate-500">{pedido.cliente.email}</span></td><td className="p-4">{(JSON.parse(pedido.servicosJson) as { nome: string }[]).map((item) => item.nome).join(", ")}{pedido.observacao && <p className="mt-1 text-xs text-slate-500">{pedido.observacao}</p>}</td><td className="p-4 text-slate-500">{new Date(pedido.criadoEm).toLocaleString()}</td><td className="p-4"><select value={pedido.status} onChange={(e) => mudarStatus(pedido.id, e.target.value)} className={`rounded-xl border p-2 font-semibold ${cores[pedido.status] || "border-slate-300"}`}>{status.map((item) => <option key={item.valor} value={item.valor}>{item.label}</option>)}</select></td></tr>)}</tbody></table>{pedidos.length === 0 && <p className="p-8 text-center text-slate-500">Nenhum pedido recebido.</p>}</div></main>;
}
