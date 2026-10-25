type Status = "SOLICITACAO_ABERTA" | "SERVICO_AGENDADO" | "FINALIZADO" | "CANCELADO" | string;

const config: Record<string, { label: string; className: string; dot: string }> = {
  SOLICITACAO_ABERTA: { label: "Solicitação em aberto", className: "border-sky-200 bg-sky-50 text-sky-800", dot: "bg-sky-500" },
  SERVICO_AGENDADO: { label: "Serviço agendado", className: "border-amber-200 bg-amber-50 text-amber-800", dot: "bg-amber-500" },
  FINALIZADO: { label: "Finalizado", className: "border-emerald-200 bg-emerald-50 text-emerald-800", dot: "bg-emerald-500" },
  CANCELADO: { label: "Cancelado", className: "border-red-200 bg-red-50 text-red-800", dot: "bg-red-500" },
};

export function nomeStatus(status: Status) {
  return config[status]?.label ?? status;
}

export function OrcamentoStatus({ status }: { status: Status }) {
  const atual = config[status] ?? { label: status, className: "border-slate-200 bg-slate-50 text-slate-700", dot: "bg-slate-400" };
  return <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${atual.className}`}><span className={`h-2 w-2 rounded-full ${atual.dot}`} />{atual.label}</span>;
}

export function ServicosOrcamento({ servicosJson }: { servicosJson: string }) {
  let servicos: { nome: string; preco?: number | null }[] = [];
  try { servicos = JSON.parse(servicosJson); } catch { servicos = []; }
  return <div className="flex flex-wrap gap-2">{servicos.map((servico, index) => <span key={`${servico.nome}-${index}`} className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700">{servico.nome}</span>)}</div>;
}
