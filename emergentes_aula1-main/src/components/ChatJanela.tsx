import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type ChatJanelaProps = {
  conversa: {
    animal: any;
    outroUsuario: any;
    mensagens: any[];
  };
  usuarioId?: number;
  onClose?: () => void;
  onEnviada?: () => void;
};

function hora(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function rotuloDia(iso: string) {
  const data = new Date(iso);
  const hoje = new Date();
  const ontem = new Date();
  ontem.setDate(hoje.getDate() - 1);

  if (data.toDateString() === hoje.toDateString()) return "Hoje";
  if (data.toDateString() === ontem.toDateString()) return "Ontem";
  return data.toLocaleDateString("pt-BR");
}

export default function ChatJanela({
  conversa,
  usuarioId,
  onClose,
  onEnviada,
}: ChatJanelaProps) {
  const [novaMensagem, setNovaMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);
  const areaRef = useRef<HTMLDivElement>(null);
  const campoRef = useRef<HTMLTextAreaElement>(null);
  const qtdAnterior = useRef(0);

  const { mensagens, animal, outroUsuario } = conversa;

  const animalId = animal?.id;
  const destinatarioId = outroUsuario?.id;

  // 🧠 código da conversa (vem da primeira mensagem)
  const codigoConversa = mensagens?.[0]?.codigoConversa;

  // Marcar como lidas
  useEffect(() => {
    if (!usuarioId || !animalId || !destinatarioId) return;

    const temMensagensNaoLidas = mensagens.some(
      (msg) => msg.destinatarioId === usuarioId && !msg.lida,
    );

    if (!temMensagensNaoLidas) return;

    async function marcarComoLidas() {
      try {
        const resp = await fetch(
          `${import.meta.env.VITE_API_URL}/contatos/marcar-lidas`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              usuarioId: Number(usuarioId),
              animalId: Number(animalId),
              outroUsuarioId: Number(destinatarioId),
            }),
          },
        );

        if (!resp.ok) return;

        window.dispatchEvent(new Event("mensagens-lidas"));
      } catch (error) {
        console.error("Erro ao marcar mensagens como lidas", error);
      }
    }

    marcarComoLidas();
  }, [animalId, destinatarioId, mensagens, usuarioId]);

  // Rola para a última mensagem só quando chega mensagem nova
  useEffect(() => {
    const area = areaRef.current;
    if (!area) return;

    const primeira = qtdAnterior.current === 0;
    if (mensagens.length !== qtdAnterior.current) {
      area.scrollTo({
        top: area.scrollHeight,
        behavior: primeira ? "auto" : "smooth",
      });
    }
    qtdAnterior.current = mensagens.length;
  }, [mensagens.length]);

  async function enviarMensagem() {
    if (!novaMensagem.trim() || !usuarioId || !animalId || !destinatarioId)
      return;

    setEnviando(true);

    try {
      const resp = await fetch(`${import.meta.env.VITE_API_URL}/contatos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mensagem: novaMensagem,
          remetenteId: Number(usuarioId),
          destinatarioId: Number(destinatarioId),
          animalId: Number(animalId),
        }),
      });

      if (!resp.ok) throw new Error("Erro ao enviar mensagem");

      setNovaMensagem("");
      if (campoRef.current) campoRef.current.style.height = "auto";
      onEnviada?.();
      campoRef.current?.focus();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao enviar mensagem");
    } finally {
      setEnviando(false);
    }
  }

  async function copiarCodigo() {
    if (!codigoConversa) return;
    try {
      await navigator.clipboard.writeText(codigoConversa);
      toast.success("Código copiado!");
    } catch {
      toast.error("Não foi possível copiar o código");
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-white">
      {/* HEADER */}
      <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-3 py-3 sm:px-5">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Voltar para as conversas"
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        )}

        {animal?.urlImagem && (
          <img
            src={animal.urlImagem}
            alt=""
            className="h-11 w-11 shrink-0 rounded-xl object-cover"
          />
        )}

        <div className="min-w-0 flex-1">
          <h2 className="truncate font-bold leading-tight text-slate-900">
            {animal?.nome}
          </h2>
          {outroUsuario?.nome && (
            <p className="truncate text-sm text-slate-500">
              Conversando com {outroUsuario.nome}
            </p>
          )}
        </div>

        {codigoConversa && (
          <div className="flex shrink-0 items-center gap-2 rounded-full bg-slate-100 py-1 pl-3 pr-1 text-xs text-slate-600">
            <span className="hidden sm:inline">Código</span>
            <b className="font-semibold text-slate-800">{codigoConversa}</b>
            <button
              type="button"
              onClick={copiarCodigo}
              className="cursor-pointer rounded-full bg-white px-2.5 py-1 font-semibold text-blue-900 shadow-sm transition hover:bg-blue-900 hover:text-white"
            >
              Copiar
            </button>
          </div>
        )}
      </header>

      {/* MENSAGENS */}
      <div
        ref={areaRef}
        className="min-h-0 flex-1 overflow-y-auto bg-slate-50 px-3 py-4 sm:px-6"
      >
        {mensagens.length === 0 && (
          <p className="py-10 text-center text-sm text-slate-500">
            Nenhuma mensagem ainda. Escreva a primeira abaixo.
          </p>
        )}

        {mensagens.map((msg, i) => {
          const anterior = mensagens[i - 1];
          const enviadaPorMim = msg.remetenteId === usuarioId;
          const novoDia =
            !anterior ||
            new Date(anterior.criadoEm).toDateString() !==
              new Date(msg.criadoEm).toDateString();
          const mudouRemetente =
            novoDia || anterior.remetenteId !== msg.remetenteId;
          const nomeRemetente = msg.remetente?.nome || "Usuário";

          return (
            <div key={msg.id}>
              {novoDia && (
                <div className="my-4 flex justify-center">
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-500 shadow-sm ring-1 ring-slate-200">
                    {rotuloDia(msg.criadoEm)}
                  </span>
                </div>
              )}

              <div
                className={`flex flex-col ${
                  enviadaPorMim ? "items-end" : "items-start"
                } ${mudouRemetente ? "mt-3" : "mt-1"}`}
              >
                {!enviadaPorMim && mudouRemetente && (
                  <span className="mb-1 ml-2 text-xs font-semibold text-slate-500">
                    {nomeRemetente}
                  </span>
                )}

                <div
                  className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-sm shadow-sm sm:max-w-md md:max-w-lg ${
                    enviadaPorMim
                      ? "rounded-br-md bg-blue-900 text-white"
                      : "rounded-bl-md bg-white text-slate-800 ring-1 ring-slate-200"
                  }`}
                >
                  <p>{msg.mensagem}</p>
                  <span
                    className={`mt-1 block text-right text-[11px] ${
                      enviadaPorMim ? "text-blue-200" : "text-slate-400"
                    }`}
                  >
                    {hora(msg.criadoEm)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* INPUT */}
      <div className="border-t border-slate-200 bg-white p-3 sm:p-4">
        <div className="flex items-end gap-2">
          <textarea
            ref={campoRef}
            rows={1}
            value={novaMensagem}
            onChange={(e) => {
              setNovaMensagem(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`;
            }}
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                !e.shiftKey &&
                !e.nativeEvent.isComposing
              ) {
                e.preventDefault();
                enviarMensagem();
              }
            }}
            placeholder="Digite sua mensagem..."
            aria-label="Digite sua mensagem"
            className="max-h-32 min-w-0 flex-1 resize-none rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-700 focus:outline-2 focus:outline-offset-0 focus:outline-blue-200"
          />

          <button
            type="button"
            onClick={enviarMensagem}
            disabled={enviando || !novaMensagem.trim()}
            aria-label="Enviar mensagem"
            className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-full bg-blue-900 text-white shadow-lg shadow-blue-900/20 transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </button>
        </div>
        <p className="mt-2 hidden text-xs text-slate-400 sm:block">
          Enter envia · Shift + Enter quebra a linha
        </p>
      </div>
    </div>
  );
}