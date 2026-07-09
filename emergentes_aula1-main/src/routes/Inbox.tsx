import { useEffect, useRef, useState } from "react";
import { useClienteStore } from "../context/ClienteContext";
import ChatJanela from "../components/ChatJanela";

export type Mensagem = {
  id: number;
  mensagem: string;
  criadoEm: string;
  animalId: number;
  remetenteId: number;
  destinatarioId: number;
  codigoConversa?: string;

  animal: any;
  remetente: any;
  destinatario: any;
};

export type Conversa = {
  animal: any;
  outroUsuario: any;
  mensagens: Mensagem[];
  codigoConversa?: string;
};

export default function Inbox() {
  const { cliente } = useClienteStore();
  const isAdmin = cliente?.role === "admin";

  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [conversaSelecionada, setConversaSelecionada] = useState<string | null>(
    null,
  );

  // 🔐 ADMIN
  const [codigoInput, setCodigoInput] = useState("");
  const [liberada, setLiberada] = useState(false);

  const pollingRef = useRef<number | null>(null);

  // =========================
  // BUSCAR MENSAGENS
  // =========================
  async function carregarMensagens() {
    if (!cliente?.id) return;

    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/contatos/inbox/${cliente.id}`,
    );

    const data: Mensagem[] = await res.json();
    if (!Array.isArray(data)) return;

    setMensagens(data);
  }

  useEffect(() => {
    if (!cliente?.id) return;

    carregarMensagens();
    pollingRef.current = setInterval(carregarMensagens, 4000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [cliente?.id]);

  // =========================
  // AGRUPAR CONVERSAS
  // =========================
  const conversas: Record<string, Conversa> = mensagens.reduce(
    (acc, msg) => {
      if (!msg.animal || !msg.remetente || !msg.destinatario) return acc;

      const outro =
        msg.remetenteId === cliente?.id ? msg.destinatario : msg.remetente;

      const chave = `${msg.animal.id}-${outro.id}`;

      if (!acc[chave]) {
        acc[chave] = {
          animal: msg.animal,
          outroUsuario: outro,
          mensagens: [],
          codigoConversa: msg.codigoConversa,
        };
      }

      acc[chave].mensagens.push(msg);
      return acc;
    },
    {} as Record<string, Conversa>,
  );

  Object.values(conversas).forEach((c) => {
    c.mensagens.sort(
      (a, b) => new Date(a.criadoEm).getTime() - new Date(b.criadoEm).getTime(),
    );
  });

  const conversaAtual = conversaSelecionada
    ? conversas[conversaSelecionada]
    : null;

  // =========================
  // ADMIN: VALIDAR CÓDIGO
  // =========================
  function validarCodigo() {
    if (!conversaAtual) return;

    if (codigoInput === conversaAtual.codigoConversa) {
      setLiberada(true);
    } else {
      alert("Código inválido");
    }
  }

  // =========================
  // UI
  // =========================
  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-gray-100 md:flex-row">
      {/* =========================
          SIDEBAR
      ========================= */}
      <div className="h-[34dvh] w-full overflow-y-auto border-b bg-white md:h-full md:w-1/3 md:border-b-0 md:border-r">
        <div className="border-b p-4 font-bold">Conversas</div>

        {Object.entries(conversas).map(([chave, conv]) => {
          const ultima = conv.mensagens[conv.mensagens.length - 1];

          return (
            <div
              key={chave}
              onClick={() => {
                setConversaSelecionada(chave);
                setLiberada(false);
                setCodigoInput("");
              }}
              className="flex cursor-pointer gap-3 border-b p-3 hover:bg-gray-100 sm:p-4"
            >
              <img
                src={conv.animal.urlImagem}
                className="h-12 w-12 rounded-full object-cover"
              />

              <div className="flex-1">
                <div className="flex justify-between">
                  <strong>{conv.animal.nome}</strong>
                  <span className="text-xs text-gray-500">
                    {ultima &&
                      new Date(ultima.criadoEm).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                  </span>
                </div>

                <div className="text-xs text-gray-500 truncate">
                  {ultima?.mensagem}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* =========================
          ÁREA PRINCIPAL
      ========================= */}
      <div className="flex flex-1 min-h-0 items-stretch justify-center">
        {!conversaAtual ? (
          <div className="flex h-full items-center justify-center p-6 text-center text-gray-400">
            Selecione uma conversa
          </div>
        ) : isAdmin && !liberada ? (
          // 🔐 ADMIN BLOQUEADO
          <div className="mx-4 w-full max-w-md self-center rounded-xl border bg-white p-5 shadow-sm sm:p-6">
            <h2 className="font-bold mb-3">🔐 Liberar conversa</h2>

            <input
              className="border w-full p-2"
              placeholder="Digite o código"
              value={codigoInput}
              onChange={(e) => setCodigoInput(e.target.value)}
            />

            <button
              onClick={validarCodigo}
              className="bg-blue-600 text-white w-full mt-2 p-2"
            >
              Liberar
            </button>
          </div>
        ) : (
          // 💬 CHAT LIBERADO
          <div className="h-full min-h-0 w-full">
            <ChatJanela
              conversa={conversaAtual}
              usuarioId={cliente?.id}
              onClose={() => {
                setConversaSelecionada(null);
                setLiberada(false);
                setCodigoInput("");
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
