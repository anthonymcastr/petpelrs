import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { AnimalComUsuario } from "../utils/animalType";
import { useClienteStore } from "../context/ClienteContext";
import { ConfirmacaoExclusao } from "./ConfirmacaoExclusao";
import { Compartilhar } from "./Compartilhar";
import { Localizacao } from "./Localizacao";

type Props = {
  animal: AnimalComUsuario;
  onClose: () => void;
  onExcluido?: () => void;
};

const tipoConfig: Record<string, { label: string; badge: string }> = {
  PERDIDO: { label: "Perdido", badge: "bg-red-600" },
  ENCONTRADO: { label: "Encontrado", badge: "bg-emerald-600" },
  ADOCAO: { label: "Adoção", badge: "bg-blue-700" },
};

export function CardExpandido({ animal, onClose, onExcluido }: Props) {
  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [exibindoConfirmacaoExclusao, setExibindoConfirmacaoExclusao] =
    useState(false);
  const { cliente } = useClienteStore();
  const navigate = useNavigate();

  const usuarioLogado = !!cliente;
  const isAdmin = cliente?.role === "admin";
  const apiUrl = import.meta.env.VITE_API_URL;

  const tipo = tipoConfig[animal.tipo] ?? {
    label: animal.tipo,
    badge: "bg-gray-600",
  };

  // Fecha com Esc e trava a rolagem da página enquanto o card está aberto
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !exibindoConfirmacaoExclusao) onClose();
    };
    window.addEventListener("keydown", aoTeclar);
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", aoTeclar);
      document.body.style.overflow = overflowAnterior;
    };
  }, [onClose, exibindoConfirmacaoExclusao]);

  const handleEnviar = async () => {
    if (!cliente?.id) return toast.error("Você precisa estar logado");
    if (!mensagem.trim()) return toast.error("Digite uma mensagem");

    const donoId = animal.usuario?.id || animal.usuarioId;

    if (!donoId) return toast.error("Erro: dono do animal não encontrado");

    if (cliente.id === donoId)
      return toast.error("Você não pode enviar mensagem para si mesmo");

    try {
      setEnviando(true);

      const payload = {
        mensagem,
        animalId: Number(animal.id),
        remetenteId: Number(cliente.id),
        destinatarioId: Number(donoId),
      };

      const res = await fetch(`${apiUrl}/contatos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const erro = await res.json();
        console.error("Erro da API:", erro);
        throw new Error(erro?.erro || "Erro ao enviar mensagem");
      }

      setMensagem("");
      toast.success("Mensagem enviada com sucesso!");
      onClose();
      navigate("/inbox");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao enviar mensagem");
    } finally {
      setEnviando(false);
    }
  };

  const handleExcluir = async () => {
    setExibindoConfirmacaoExclusao(true);
  };

  const confirmarExclusao = async () => {
    try {
      const token = cliente?.token;
      if (!token && !isAdmin) {
        toast.error("Apenas administradores podem excluir animais");
        return;
      }

      const res = await fetch(`${apiUrl}/animais/${animal.id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (!res.ok) throw new Error("Erro ao excluir animal");

      toast.success("Animal excluído com sucesso!");
      onExcluido?.();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao excluir animal");
    } finally {
      setExibindoConfirmacaoExclusao(false);
    }
  };

  const chip = animal.chip || "Não contém";
  const temChip = chip !== "Não contém";

  const infos = [
    { rotulo: "Raça", valor: animal.raca },
    {
      rotulo: "Idade",
      valor:
        animal.idade != null
          ? `${animal.idade} ${animal.idade === 1 ? "ano" : "anos"}`
          : "Não informada",
    },
    { rotulo: "Cidade", valor: animal.cidade, capitalizar: true },
    { rotulo: "Responsável", valor: animal.usuario?.nome || "Não informado" },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Detalhes de ${animal.nome}`}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl animate-fade-in"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-3 top-3 z-10 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/90 text-slate-700 shadow transition hover:scale-110 hover:bg-white"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.2}
            strokeLinecap="round"
            className="h-5 w-5"
            aria-hidden="true"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <div className="flex max-h-[92dvh] flex-col overflow-y-auto rounded-3xl bg-white shadow-2xl md:flex-row md:overflow-hidden">
          {/* Foto */}
          <div className="relative h-72 shrink-0 bg-slate-100 md:h-auto md:w-1/2">
            <img
              src={animal.urlImagem}
              alt={animal.nome}
              className="h-full w-full object-cover"
            />
            <span
              className={`absolute left-4 top-4 rounded-full px-4 py-1.5 text-sm font-semibold text-white shadow ${tipo.badge}`}
            >
              {tipo.label}
            </span>
          </div>

          {/* Informações */}
          <div className="flex flex-1 flex-col p-6 md:min-h-0 md:overflow-y-auto md:p-8">
            <h2 className="pr-10 text-3xl font-extrabold tracking-tight text-slate-900">
              {animal.nome}
            </h2>

            <dl className="mt-5 grid grid-cols-2 gap-3">
              {infos.map((info) => (
                <div
                  key={info.rotulo}
                  className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200/70"
                >
                  <dt className="text-xs font-medium text-slate-500">
                    {info.rotulo}
                  </dt>
                  <dd
                    className={`mt-0.5 truncate font-semibold text-slate-900 ${
                      info.capitalizar ? "capitalize" : ""
                    }`}
                    title={info.valor}
                  >
                    {info.capitalizar ? info.valor?.toLowerCase() : info.valor}
                  </dd>
                </div>
              ))}

              {/* Chip (largura total) */}
              <div className="col-span-2 rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200/70">
                <dt className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                    aria-hidden="true"
                  >
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                    <rect x="10" y="10" width="4" height="4" rx="0.5" />
                    <path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3" />
                  </svg>
                  Chip
                </dt>
                <dd
                  className={`mt-0.5 break-all ${
                    temChip
                      ? "font-mono text-base font-semibold tracking-wider text-blue-900"
                      : "font-medium text-slate-400"
                  }`}
                >
                  {chip}
                </dd>
              </div>
            </dl>

            <div className="mt-6 border-t border-slate-200 pt-6">
              <h3 className="text-lg font-bold text-slate-900">
                Falar com o responsável
              </h3>

              <textarea
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                rows={4}
                placeholder={
                  usuarioLogado
                    ? "Escreva sua mensagem para o responsável..."
                    : "Entre na sua conta para enviar uma mensagem"
                }
                disabled={!usuarioLogado || enviando}
                className="mt-3 w-full resize-none rounded-2xl border border-slate-300 bg-white p-3 text-slate-900 placeholder:text-slate-400 focus:border-blue-700 focus:outline-2 focus:outline-offset-0 focus:outline-blue-200 disabled:bg-slate-100"
              />

              {usuarioLogado ? (
                <button
                  type="button"
                  onClick={handleEnviar}
                  disabled={enviando}
                  className="mt-3 w-full cursor-pointer rounded-xl bg-blue-900 py-3 font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {enviando ? "Enviando..." : "Enviar mensagem"}
                </button>
              ) : (
                <Link
                  to="/login"
                  className="mt-3 block w-full rounded-xl bg-blue-900 py-3 text-center font-semibold text-white transition hover:bg-blue-800"
                >
                  Entrar para enviar mensagem
                </Link>
              )}
            </div>

            <div className="mt-3 space-y-3">
              <Localizacao
                nome={animal.nome}
                urlImagem={animal.urlImagem}
                latitude={animal.latitude}
                longitude={animal.longitude}
                variante="botao"
              />

              <Compartilhar
                id={animal.id}
                nome={animal.nome}
                tipo={animal.tipo}
                variante="botao"
              />

              {isAdmin && (
                <button
                  type="button"
                  onClick={handleExcluir}
                  className="w-full cursor-pointer rounded-xl border border-red-200 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-600 hover:text-white"
                >
                  Excluir animal (admin)
                </button>
              )}
            </div>
          </div>
        </div>

        <ConfirmacaoExclusao
          aberto={exibindoConfirmacaoExclusao}
          titulo="Excluir animal?"
          mensagem="Deseja realmente excluir este animal? Essa ação não pode ser desfeita."
          textoConfirmar="Sim, excluir"
          onCancelar={() => setExibindoConfirmacaoExclusao(false)}
          onConfirmar={confirmarExclusao}
        />
      </div>
    </div>
  );
}