import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAdminStore } from "./context/AdminContext";

type Pedido = { id: number; status: string; criadoEm: string; cliente: { nome: string; email: string }; petshop: { nome: string }; servicosJson: string };
const nomes: Record<string, string> = { SOLICITACAO_ABERTA: "Solicitação em aberto", SERVICO_AGENDADO: "Serviço agendado", FINALIZADO: "Finalizado", CANCELADO: "Cancelado" };

export default function AdminOrcamentos() {
  const { admin } = useAdminStore();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const apiUrl = import.meta.env.VITE_API_URL;
  useEffect(() => { if (admin?.token) fetch(`${apiUrl}/orcamentos/admin`, { headers: { Authorization: `Bearer ${admin.token}` } }).then((res) => res.json()).then(setPedidos).catch(() => toast.error("Erro ao carregar histórico")); }, [admin?.token]);
  return <main className="mx-auto max-w-6xl"><header><p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-700">Administração</p><h1 className="mt-2 text-3xl font-black text-slate-900">Histórico de orçamentos</h1></header><div className="mt-6 overflow-x-auto rounded-3xl bg-white shadow-sm ring-1 ring-slate-200"><table className="w-full min-w-[800px] text-left text-sm"><thead className="border-b bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-4">Usuário</th><th className="p-4">Petshop</th><th className="p-4">Serviços</th><th className="p-4">Data</th><th className="p-4">Status</th></tr></thead><tbody>{pedidos.map((pedido) => <tr key={pedido.id} className="border-b last:border-0"><td className="p-4"><strong>{pedido.cliente.nome}</strong><br />{pedido.cliente.email}</td><td className="p-4">{pedido.petshop.nome}</td><td className="p-4">{(JSON.parse(pedido.servicosJson) as { nome: string }[]).map((item) => item.nome).join(", ")}</td><td className="p-4 text-slate-500">{new Date(pedido.criadoEm).toLocaleString()}</td><td className="p-4"><span className="rounded-full bg-blue-50 px-3 py-1 font-semibold text-blue-900">{nomes[pedido.status] || pedido.status}</span></td></tr>)}</tbody></table>{pedidos.length === 0 && <p className="p-8 text-center text-slate-500">Nenhum orçamento registrado.</p>}</div></main>;
}
