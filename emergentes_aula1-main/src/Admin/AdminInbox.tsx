import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAdminStore } from "./context/AdminContext";

type ContatoResumo = {
  id: number;
  codigoConversa?: string;
  mensagem: string;
  criadoEm: string;
  animal: any;
  cliente: any;
  remetente?: any;
  destinatario?: any;
};

type Mensagem = {
  id: number;
  mensagem: string;
  criadoEm: string;
  remetente: any;
  destinatario: any;
  animal: any;
  codigoConversa?: string;
};

export default function AdminInbox() {
  const { admin } = useAdminStore();

  const [contatos, setContatos] = useState<ContatoResumo[]>([]);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [contatoSelecionado, setContatoSelecionado] =
    useState<ContatoResumo | null>(null);

  // 🔐 controle de acesso
  const [codigoInput, setCodigoInput] = useState("");
  const [conversaLiberada, setConversaLiberada] = useState(false);

  async function carregarContatos() {
    if (!admin?.token) return;

    const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/contatos`, {
      headers: { Authorization: `Bearer ${admin.token}` },
    });

    const data = await res.json();
    setContatos(data);
  }

  useEffect(() => {
    carregarContatos();
  }, [admin?.token]);

  async function liberarConversa() {
    if (!contatoSelecionado?.codigoConversa) {
      toast.error("Conversa sem código");
      return;
    }

    if (codigoInput !== contatoSelecionado.codigoConversa) {
      toast.error("Código incorreto");
      return;
    }

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/contatos/validar-codigo`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${admin?.token}`,
          },
          body: JSON.stringify({ codigo: contatoSelecionado.codigoConversa }),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        toast.error(data?.erro || "Não foi possível liberar a conversa");
        return;
      }

      setMensagens(data);
      setConversaLiberada(true);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao liberar conversa");
    }
  }

  // =========================
  // UI
  // =========================
  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden md:flex-row">
      {/* SIDEBAR */}
      <div className="h-[32dvh] w-full overflow-y-auto border-b bg-white md:h-full md:w-1/3 md:border-b-0 md:border-r">
        <h2 className="border-b p-3 font-bold">Admin - Conversas</h2>

        {contatos.map((contato) => (
          <div
            key={contato.id}
            className={`cursor-pointer border-b p-3 hover:bg-gray-100 ${
              contatoSelecionado?.id === contato.id ? "bg-gray-100" : ""
            }`}
            onClick={() => {
              setContatoSelecionado(contato);
              setCodigoInput("");
              setConversaLiberada(false);
              setMensagens([]);
            }}
          >
            <div className="flex items-center gap-3">
              <img
                src={contato.animal.urlImagem}
                className="h-10 w-10 rounded-full object-cover"
              />

              <div className="flex-1">
                <div className="flex justify-between">
                  <strong>{contato.animal.nome}</strong>
                  <span className="text-red-500 text-xs">🔒</span>
                </div>

                <div className="text-xs text-gray-500">
                  {contato.remetente?.nome || contato.cliente?.nome}
                  {contato.destinatario?.nome
                    ? ` → ${contato.destinatario.nome}`
                    : ""}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CHAT */}
      <div className="flex min-h-0 flex-1 flex-col">
        {!contatoSelecionado ? (
          <div className="flex flex-1 items-center justify-center p-6 text-center text-gray-400">
            Selecione uma conversa
          </div>
        ) : !conversaLiberada ? (
          <div className="flex flex-1 items-center justify-center p-4 sm:p-6">
            <div className="w-full max-w-md rounded-xl border bg-white p-5 shadow-sm sm:p-6">
              <div className="text-sm text-gray-500 mb-2">
                Conversa bloqueada
              </div>

              <h3 className="font-bold text-lg mb-2">
                {contatoSelecionado.animal.nome}
              </h3>

              <p className="text-sm text-gray-600 mb-4">
                Digite o código da conversa para liberar o chat.
              </p>

              <input
                value={codigoInput}
                onChange={(e) => setCodigoInput(e.target.value)}
                placeholder="Código da conversa"
                className="w-full p-3 border rounded-lg mb-3"
              />

              <button
                onClick={liberarConversa}
                className="w-full bg-blue-600 text-white py-3 rounded-lg"
              >
                Liberar conversa
              </button>
            </div>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col bg-gray-50">
            <div className="border-b bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-bold">
                    {contatoSelecionado.animal.nome}
                  </div>
                  <div className="text-xs text-gray-500">
                    Código: {contatoSelecionado.codigoConversa}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    {contatoSelecionado.remetente?.nome ||
                      contatoSelecionado.cliente?.nome}
                    {contatoSelecionado.destinatario?.nome
                      ? ` → ${contatoSelecionado.destinatario.nome}`
                      : ""}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setContatoSelecionado(null);
                    setConversaLiberada(false);
                    setCodigoInput("");
                    setMensagens([]);
                  }}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Fechar
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-0 space-y-3 overflow-y-auto p-3 sm:p-4">
              {mensagens.map((msg) => (
                <div
                  key={msg.id}
                  className="max-w-[85%] break-words whitespace-pre-wrap rounded-lg border bg-white p-3 sm:max-w-2xl"
                >
                  <p className="text-[11px] font-semibold text-gray-600 mb-1">
                    De: {msg.remetente?.nome || "Não informado"}
                    {msg.destinatario?.nome
                      ? ` · Para: ${msg.destinatario.nome}`
                      : ""}
                  </p>
                  <p className="text-sm">{msg.mensagem}</p>
                  <span className="text-[10px] text-gray-400 block mt-1">
                    {new Date(msg.criadoEm).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
