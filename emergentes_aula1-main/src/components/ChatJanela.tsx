import { useEffect, useState } from "react";

type ChatJanelaProps = {
  conversa: {
    animal: any;
    outroUsuario: any;
    mensagens: any[];
  };
  usuarioId?: number;
  onClose?: () => void;
};

export default function ChatJanela({
  conversa,
  usuarioId,
  onClose,
}: ChatJanelaProps) {
  const [novaMensagem, setNovaMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);

  const { mensagens, animal, outroUsuario } = conversa;

  const animalId = animal?.id;
  const destinatarioId = outroUsuario?.id;

  // 🧠 código da conversa (vem da primeira mensagem)
  const codigoConversa = mensagens?.[0]?.codigoConversa;

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
      // polling vai atualizar automaticamente
    } catch (error) {
      console.error(error);
      alert("Erro ao enviar mensagem");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* HEADER */}
      <div className="border-b bg-gray-100 p-3 sm:p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-bold leading-tight">
              Conversa sobre {animal?.nome}
            </div>

            {outroUsuario?.nome && (
              <div className="mt-1 text-xs text-gray-600">
                Conversando com {outroUsuario.nome}
              </div>
            )}

            {/* Código da conversa */}
            {codigoConversa && (
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-600">
                <span>
                  Código: <b>{codigoConversa}</b>
                </span>

                <button
                  onClick={() => navigator.clipboard.writeText(codigoConversa)}
                  className="text-blue-600 hover:underline"
                >
                  copiar
                </button>
              </div>
            )}
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Fechar
            </button>
          )}
        </div>
      </div>

      {/* MENSAGENS */}
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-gray-50 p-3 sm:p-4">
        {mensagens.map((msg) => {
          const enviadaPorMim = msg.remetenteId === usuarioId;
          const nomeRemetente =
            msg.remetente?.nome || (enviadaPorMim ? "Você" : "Usuário");
          const nomeDestinatario = msg.destinatario?.nome;

          return (
            <div
              key={msg.id}
              className={`max-w-[85%] break-words whitespace-pre-wrap rounded-lg p-3 text-sm sm:max-w-md md:max-w-lg ${
                enviadaPorMim
                  ? "ml-auto bg-blue-500 text-white"
                  : "mr-auto bg-white border"
              }`}
            >
              <div className="text-[10px] font-semibold opacity-80 mb-1">
                {enviadaPorMim ? `${nomeRemetente}` : nomeRemetente}
                {nomeDestinatario && !enviadaPorMim && (
                  <span className="font-normal">
                    {" "}
                    · para {nomeDestinatario}
                  </span>
                )}
              </div>

              <p>{msg.mensagem}</p>

              <span className="text-[10px] opacity-70 block mt-1">
                {new Date(msg.criadoEm).toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>

      {/* INPUT */}
      <div className="border-t bg-white p-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={novaMensagem}
            onChange={(e) => setNovaMensagem(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="w-full flex-1 rounded border px-3 py-2"
          />

          <button
            onClick={enviarMensagem}
            disabled={enviando}
            className="w-full rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50 sm:w-auto"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}
