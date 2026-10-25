import { useMemo } from "react";

export type FiltrosOrcamento = { status: string; inicio: string; fim: string };
export type PedidoFiltravel = { status: string; criadoEm: string };

export function filtrarPedidos<T extends PedidoFiltravel>(pedidos: T[], filtros: FiltrosOrcamento) {
  const inicio = filtros.inicio ? new Date(`${filtros.inicio}T00:00:00`).getTime() : null;
  const fim = filtros.fim ? new Date(`${filtros.fim}T23:59:59.999`).getTime() : null;
  return pedidos.filter((pedido) => {
    const data = new Date(pedido.criadoEm).getTime();
    return (!filtros.status || pedido.status === filtros.status) && (inicio === null || data >= inicio) && (fim === null || data <= fim);
  });
}

export function OrcamentoFiltros({ filtros, onChange, total }: { filtros: FiltrosOrcamento; onChange: (filtros: FiltrosOrcamento) => void; total: number }) {
  const ativo = useMemo(() => Boolean(filtros.status || filtros.inicio || filtros.fim), [filtros]);
  return <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-end"><label className="flex-1 text-xs font-bold uppercase tracking-wider text-slate-500">Status<select value={filtros.status} onChange={(e) => onChange({ ...filtros, status: e.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold normal-case tracking-normal text-slate-800 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"><option value="">Todos os status</option><option value="SOLICITACAO_ABERTA">Solicitação em aberto</option><option value="SERVICO_AGENDADO">Serviço agendado</option><option value="FINALIZADO">Finalizado</option><option value="CANCELADO">Cancelado</option></select></label><label className="flex-1 text-xs font-bold uppercase tracking-wider text-slate-500">De<input type="date" value={filtros.inicio} onChange={(e) => onChange({ ...filtros, inicio: e.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-semibold normal-case tracking-normal text-slate-800 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100" /></label><label className="flex-1 text-xs font-bold uppercase tracking-wider text-slate-500">Até<input type="date" value={filtros.fim} onChange={(e) => onChange({ ...filtros, fim: e.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-semibold normal-case tracking-normal text-slate-800 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100" /></label><div className="flex items-center justify-between gap-3 lg:pb-0.5"><span className="text-sm text-slate-500"><strong className="text-slate-900">{total}</strong> resultado{total === 1 ? "" : "s"}</span><button type="button" disabled={!ativo} onClick={() => onChange({ status: "", inicio: "", fim: "" })} className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">Limpar filtros</button></div></div></section>;
}
