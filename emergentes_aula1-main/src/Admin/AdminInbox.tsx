import { useEffect, useState } from "react";
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
      alert("Conversa sem código");
      return;
    }

    if (codigoInput !== contatoSelecionado.codigoConversa) {
      alert("Código incorreto");
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
        alert(data?.erro || "Não foi possível liberar a conversa");
        return;
      }

      setMensagens(data);
      setConversaLiberada(true);
    } catch (error) {
      console.error(error);
      alert("Erro ao liberar conversa");
    }
  }

  // =========================
  // UI
  // =========================
  return (
    <div className="flex h-screen">
      {/* SIDEBAR */}
      <div className="w-1/3 border-r overflow-y-auto bg-white">
        <h2 className="p-3 font-bold border-b">Admin - Conversas</h2>

        {contatos.map((contato) => (
          <div
            key={contato.id}
            className={`p-3 border-b cursor-pointer hover:bg-gray-100 ${
              contatoSelecionado?.id === contato.id ? "bg-gray-100" : ""
            }`}
            onClick={() => {
              setContatoSelecionado(contato);
              setCodigoInput("");
              setConversaLiberada(false);
              setMensagens([]);
            }}
          >
            <div className="flex gap-3 items-center">
              <img
                src={contato.animal.urlImagem}
                className="w-10 h-10 rounded-full object-cover"
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
      <div className="flex-1">
        {!contatoSelecionado ? (
          <div className="h-full flex items-center justify-center text-gray-400">
            Selecione uma conversa
          </div>
        ) : !conversaLiberada ? (
          <div className="h-full flex items-center justify-center p-6">
            <div className="w-full max-w-md bg-white border rounded-xl p-6 shadow-sm">
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
          <div className="h-full flex flex-col bg-gray-50">
            <div className="p-4 border-b bg-white">
              <div className="font-bold">{contatoSelecionado.animal.nome}</div>
              <div className="text-xs text-gray-500">
                Código: {contatoSelecionado.codigoConversa}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {contatoSelecionado.remetente?.nome ||
                  contatoSelecionado.cliente?.nome}
                {contatoSelecionado.destinatario?.nome
                  ? ` → ${contatoSelecionado.destinatario.nome}`
                  : ""}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {mensagens.map((msg) => (
                <div
                  key={msg.id}
                  className="max-w-2xl bg-white border rounded-lg p-3"
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
