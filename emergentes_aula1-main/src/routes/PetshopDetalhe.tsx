import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { PetshopType } from "../utils/petshopType";
import { useClienteStore } from "../context/ClienteContext";
import { Localizacao } from "../components/Localizacao";

const brl = (valor: number) =>
  valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// Se vier só DDD + telefone, coloca o 55 do Brasil na frente
function numeroWhatsapp(bruto: string) {
  const n = bruto.replace(/\D/g, "");
  return n.length <= 11 ? `55${n}` : n;
}

function IconeLinha({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mt-0.5 h-5 w-5 shrink-0 text-blue-900"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export default function PetshopDetalhe() {
  const { id } = useParams();
  const [petshop, setPetshop] = useState<PetshopType | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [naoEncontrada, setNaoEncontrada] = useState(false);
  const [selecionados, setSelecionados] = useState<number[]>([]);
  const [observacao, setObservacao] = useState("");
  const [enviandoOrcamento, setEnviandoOrcamento] = useState(false);
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);
  const [enviarPorWhatsapp, setEnviarPorWhatsapp] = useState(true);
  const { cliente } = useClienteStore();
  const navigate = useNavigate();

  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    async function buscar() {
      try {
        const res = await fetch(`${apiUrl}/petshops/${id}`);
        if (!res.ok) {
          setNaoEncontrada(true);
          return;
        }
        setPetshop(await res.json());
      } catch (err) {
        console.error(err);
        setNaoEncontrada(true);
      } finally {
        setCarregando(false);
      }
    }
    buscar();
  }, [apiUrl, id]);

  const escolhidos = useMemo(
    () => petshop?.servicos.filter((s) => selecionados.includes(s.id)) ?? [],
    [petshop, selecionados],
  );

  const totalEstimado = escolhidos.reduce((soma, s) => soma + (s.preco ?? 0), 0);
  const temSobConsulta = escolhidos.some((s) => s.preco == null);

  function alternar(servicoId: number) {
    setSelecionados((atual) =>
      atual.includes(servicoId)
        ? atual.filter((x) => x !== servicoId)
        : [...atual, servicoId],
    );
  }

  function abrirConfirmacao() {
    if (!petshop || escolhidos.length === 0) return;
    setMostrarConfirmacao(true);
  }

  async function confirmarEnvio() {
    if (!petshop || escolhidos.length === 0) return;
    if (!cliente?.token) {
      toast.error("Entre na sua conta para receber a confirmação por e-mail");
      return;
    }

    setEnviandoOrcamento(true);
    const janelaWhatsapp = enviarPorWhatsapp ? window.open("about:blank", "_blank") : null;

    if (enviarPorWhatsapp && !janelaWhatsapp) {
      setEnviandoOrcamento(false);
      toast.error("Permita pop-ups para abrir o WhatsApp");
      return;
    }

    if (janelaWhatsapp) janelaWhatsapp.document.title = "Abrindo WhatsApp...";

    const linhas = escolhidos.map(
      (s) => `• ${s.nome} (${s.preco != null ? brl(s.preco) : "sob consulta"})`,
    );

    const partes = [
      `Olá, *${petshop.nome}*! Vim pelo PetPel RS e tenho interesse nos seguintes serviços:`,
      "",
      ...linhas,
    ];

    if (observacao.trim()) {
      partes.push("", `Observações: ${observacao.trim()}`);
    }

    partes.push(
      "",
      "Poderiam me passar valores e horários disponíveis? Obrigado!",
      "",
      "Cupom: #PETPELRS",
    );

    try {
      const resposta = await fetch(`${apiUrl}/orcamentos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cliente.token}`,
        },
        body: JSON.stringify({
          petshopId: petshop.id,
          servicoIds: escolhidos.map((servico) => servico.id),
          observacao: observacao.trim() || undefined,
        }),
      });
      const dados = await resposta.json();
      if (!resposta.ok) throw new Error(dados.erro || "Não foi possível enviar o orçamento");

      const url = `https://wa.me/${numeroWhatsapp(petshop.whatsapp)}?text=${encodeURIComponent(partes.join("\n"))}`;

      if (janelaWhatsapp) janelaWhatsapp.location.href = url;
      toast.success("Pedido enviado! A confirmação foi enviada para seu e-mail.");
      setMostrarConfirmacao(false);
      navigate("/orcamentos");
    } catch (error) {
      janelaWhatsapp?.close();
      toast.error(error instanceof Error ? error.message : "Erro ao enviar orçamento");
    } finally {
      setEnviandoOrcamento(false);
    }
  }

  if (carregando) {
    return (
      <div className="mx-auto max-w-3xl animate-pulse space-y-4 px-4 py-10">
        <div className="h-8 w-1/3 rounded bg-slate-200" />
        <div className="h-48 rounded-3xl bg-slate-200" />
        <div className="h-24 rounded-3xl bg-slate-200" />
      </div>
    );
  }

  if (naoEncontrada || !petshop) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-xl ring-1 ring-slate-200">
          <h1 className="text-xl font-bold text-slate-900">
            Loja não encontrada
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Essa loja não existe mais ou está temporariamente indisponível.
          </p>
          <Link
            to="/parceiros"
            className="mt-6 block rounded-xl bg-blue-900 py-3 font-semibold text-white transition hover:bg-blue-800"
          >
            Ver todas as lojas
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Link
          to="/parceiros"
          className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
        >
          ← Parceiros
        </Link>

        {/* Cabeçalho da loja */}
        <section className="mt-4 overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-slate-200">
          {petshop.logoUrl ? (
            <img
              src={petshop.logoUrl}
              alt={`Fachada ou logo da ${petshop.nome}`}
              className="h-48 w-full object-cover md:h-60"
            />
          ) : (
            <div
              className="flex h-40 w-full items-center justify-center bg-gradient-to-br from-blue-900 to-blue-600 text-7xl font-extrabold text-white/90"
              aria-hidden="true"
            >
              {petshop.nome.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="p-6 md:p-8">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              {petshop.nome}
            </h1>

            {petshop.descricao && (
              <p className="mt-2 text-slate-600">{petshop.descricao}</p>
            )}

            <div className="mt-5">
              <Localizacao
                nome={petshop.nome}
                urlImagem={petshop.logoUrl || ""}
                latitude={petshop.latitude}
                longitude={petshop.longitude}
                variante="botao"
              />
            </div>

            <div className="mt-5 space-y-3 text-sm text-slate-700">
              {petshop.endereco && (
                <p className="flex items-start gap-2">
                  <IconeLinha>
                    <path d="M12 21s-7-6.2-7-11a7 7 0 0114 0c0 4.8-7 11-7 11z" />
                    <circle cx="12" cy="10" r="2.5" />
                  </IconeLinha>
                  {petshop.endereco}
                </p>
              )}
              {petshop.horario && (
                <p className="flex items-start gap-2">
                  <IconeLinha>
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 2" />
                  </IconeLinha>
                  {petshop.horario}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Serviços */}
        <section className="mt-8">
          <h2 className="text-xl font-bold text-slate-900">
            Escolha os serviços
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Marque um ou mais. A loja confirma valores e horários pelo WhatsApp.
          </p>

          {petshop.servicos.length === 0 ? (
            <p className="mt-6 rounded-2xl bg-white p-6 text-center text-sm text-slate-500 ring-1 ring-slate-200">
              Esta loja ainda não cadastrou serviços.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {petshop.servicos.map((s) => (
                <li key={s.id}>
                  <label className="block cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selecionados.includes(s.id)}
                      onChange={() => alternar(s.id)}
                      className="peer sr-only"
                    />
                    <span className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-300 peer-checked:border-blue-700 peer-checked:bg-blue-50 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-blue-700">
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition ${
                          selecionados.includes(s.id)
                            ? "border-blue-900 bg-blue-900 text-white"
                            : "border-slate-300 bg-white text-transparent"
                        }`}
                        aria-hidden="true"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={3}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-4 w-4"
                        >
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold text-slate-900">
                          {s.nome}
                        </span>
                        {s.descricao && (
                          <span className="mt-0.5 block text-sm text-slate-500">
                            {s.descricao}
                          </span>
                        )}
                      </span>

                      <span
                        className={`shrink-0 text-sm font-semibold ${
                          s.preco != null ? "text-blue-900" : "text-slate-400"
                        }`}
                      >
                        {s.preco != null ? brl(s.preco) : "Sob consulta"}
                      </span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}

          {petshop.servicos.length > 0 && (
            <div className="mt-6">
              <label
                htmlFor="observacao"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Observações <span className="font-normal text-slate-400">(opcional)</span>
              </label>
              <textarea
                id="observacao"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                rows={3}
                maxLength={300}
                placeholder="Ex: Meu cachorro é um Poodle de 3 anos e tem medo de secador."
                className="w-full resize-none rounded-2xl border border-slate-300 bg-white p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-700 focus:outline-2 focus:outline-offset-0 focus:outline-blue-200"
              />
            </div>
          )}
        </section>
      </div>

      {/* Barra de envio */}
      {petshop.servicos.length > 0 && (
        <div className="sticky bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-3xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm">
              {escolhidos.length === 0 ? (
                <p className="text-slate-500">Nenhum serviço selecionado</p>
              ) : (
                <>
                  <p className="font-semibold text-slate-900">
                    {escolhidos.length}{" "}
                    {escolhidos.length === 1
                      ? "serviço selecionado"
                      : "serviços selecionados"}
                  </p>
                  <p className="text-slate-500">
                    {totalEstimado > 0 ? `Estimado: ${brl(totalEstimado)}` : "Valor sob consulta"}
                    {totalEstimado > 0 && temSobConsulta && " + itens sob consulta"}
                  </p>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={abrirConfirmacao}
              disabled={escolhidos.length === 0 || enviandoOrcamento}
              className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-900 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-900/20 transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
            >
              {enviandoOrcamento ? "Enviando pedido..." : "Enviar orçamento"}
            </button>
          </div>
        </div>
      )}

      {mostrarConfirmacao && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 px-4 py-6" onClick={() => !enviandoOrcamento && setMostrarConfirmacao(false)}>
          <div role="dialog" aria-modal="true" aria-label="Confirmar orçamento" className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <h2 className="text-2xl font-black text-slate-900">Confirmar orçamento</h2>
            <p className="mt-2 text-sm text-slate-600">Confira os serviços selecionados antes de enviar para {petshop.nome}.</p>
            <ul className="mt-5 space-y-2 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
              {escolhidos.map((servico) => <li key={servico.id} className="flex justify-between gap-3"><span>{servico.nome}</span><strong>{servico.preco != null ? brl(servico.preco) : "Sob consulta"}</strong></li>)}
            </ul>
            {observacao.trim() && <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-600"><strong>Observação:</strong> {observacao.trim()}</p>}
            <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 p-4 text-sm text-slate-700">
              <input type="checkbox" checked={enviarPorWhatsapp} onChange={(event) => setEnviarPorWhatsapp(event.target.checked)} className="mt-0.5 h-4 w-4 accent-green-600" />
              <span><strong>Enviar solicitação também via WhatsApp</strong><span className="mt-1 block text-slate-500">A mensagem incluirá os serviços e o cupom #PETPELRS.</span></span>
            </label>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setMostrarConfirmacao(false)} disabled={enviandoOrcamento} className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50">Cancelar</button>
              <button type="button" onClick={confirmarEnvio} disabled={enviandoOrcamento} className="rounded-xl bg-blue-900 px-5 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-60">{enviandoOrcamento ? "Enviando..." : "Confirmar e enviar orçamento"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}