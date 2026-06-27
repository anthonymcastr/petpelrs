import { useEffect, useState } from "react";

type ChatJanelaProps = {
  conversa: {
    animal: any;
    outroUsuario: any;
    mensagens: any[];
  };
  usuarioId?: number;
};

export default function ChatJanela({ conversa, usuarioId }: ChatJanelaProps) {
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
      (msg) => msg.destinatarioId === usuarioId && !msg.lida
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
          }
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
    <div className="flex flex-col flex-1 border-l">

      {/* HEADER */}
      <div className="p-4 border-b bg-gray-100">
        <div className="font-bold">
          Conversa sobre {animal?.nome}
        </div>

        {/* Código da conversa */}
        {codigoConversa && (
          <div className="text-xs text-gray-600 mt-1 flex items-center gap-2">
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

      {/* MENSAGENS */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {mensagens.map((msg) => {
          const enviadaPorMim = msg.remetenteId === usuarioId;

          return (
            <div
              key={msg.id}
              className={`max-w-xs p-3 rounded-lg text-sm ${
                enviadaPorMim
                  ? "ml-auto bg-blue-500 text-white"
                  : "mr-auto bg-white border"
              }`}
            >
              <p>{msg.mensagem}</p>

              <span className="text-[10px] opacity-70 block mt-1">
                {new Date(msg.criadoEm).toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>

      {/* INPUT */}
      <div className="p-4 border-t flex gap-2">
        <input
          value={novaMensagem}
          onChange={(e) => setNovaMensagem(e.target.value)}
          placeholder="Digite sua mensagem..."
          className="flex-1 border rounded px-3 py-2"
        />

        <button
          onClick={enviarMensagem}
          disabled={enviando}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}