import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useClienteStore } from "../context/ClienteContext";
import { useAdminStore } from "../Admin/context/AdminContext";

type ContatoType = {
  id: number;
  codigoConversa?: string;
  mensagem: string;
  resposta?: string;
  criadoEm: string;
  remetente?: {
    id: number;
    nome: string;
    email?: string;
  };
  destinatario?: {
    id: number;
    nome: string;
    email?: string;
  };
  animal: {
    id: number;
    nome: string;
    raca: string;
    idade: number;
    urlImagem: string;
    cidade: string;
    tipo: string;
  };
  cliente: {
    id: number;
    nome: string;
    email: string;
  };
};

type MensagemConversa = {
  id: number;
  mensagem: string;
  criadoEm: string;
  remetente: {
    id: number;
    nome: string;
  };
  destinatario: {
    id: number;
    nome: string;
  };
  animal: {
    id: number;
    nome: string;
    urlImagem: string;
    raca: string;
    cidade: string;
  };
  codigoConversa: string;
};

const apiUrl = import.meta.env.VITE_API_URL;

export default function Contato() {
  const [contatos, setContatos] = useState<ContatoType[]>([]);
  const [contatoSelecionado, setContatoSelecionado] =
    useState<ContatoType | null>(null);
  const [codigoInput, setCodigoInput] = useState("");
  const [conversaLiberada, setConversaLiberada] = useState(false);
  const [mensagensLiberadas, setMensagensLiberadas] = useState<
    MensagemConversa[]
  >([]);

  const { cliente } = useClienteStore();
  const { admin } = useAdminStore();

  useEffect(() => {
    async function buscar() {
      try {
        if (admin?.role === "admin") {
          const res = await fetch(`${apiUrl}/admin/contatos`, {
            headers: { Authorization: `Bearer ${admin.token}` },
          });
          const data = await res.json();

          setContatos(data);
        } else if (cliente) {
          const res = await fetch(`${apiUrl}/contatos/${cliente.id}`);
          setContatos(await res.json());
        }
      } catch (err) {
        console.error(err);
      }
    }
    buscar();
  }, [admin, cliente]);

  function dataDMA(data: string) {
    return new Date(data).toLocaleDateString("pt-BR");
  }

  async function liberarConversa() {
    if (!contatoSelecionado?.codigoConversa) {
      toast.error("Conversa sem código");
      return;
    }

    if (codigoInput === contatoSelecionado.codigoConversa) {
      if (admin?.role === "admin") {
        try {
          const res = await fetch(`${apiUrl}/admin/contatos/validar-codigo`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${admin.token}`,
            },
            body: JSON.stringify({ codigo: contatoSelecionado.codigoConversa }),
          });

          const data = await res.json();

          if (!res.ok) {
            toast.error(data?.erro || "Não foi possível liberar a conversa");
            return;
          }

          setMensagensLiberadas(data);
        } catch (error) {
          console.error(error);
          toast.error("Erro ao liberar conversa");
          return;
        }
      }

      setConversaLiberada(true);
      return;
    }

    toast.error("Código incorreto");
  }

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-gray-100 md:flex-row">
      {/* SIDEBAR */}
      <aside className="h-[32dvh] w-full overflow-y-auto border-b bg-white md:h-full md:w-1/3 md:border-b-0 md:border-r lg:w-1/4">
        <h2 className="border-b p-4 text-xl font-bold">Conversas</h2>

        {contatos.map((contato) => (
          <div
            key={contato.id}
            onClick={() => {
              setContatoSelecionado(contato);
              setCodigoInput("");
              setConversaLiberada(false);
              setMensagensLiberadas([]);
            }}
            className={`flex cursor-pointer gap-3 p-4 hover:bg-gray-100 ${
              contatoSelecionado?.id === contato.id ? "bg-gray-200" : ""
            }`}
          >
            <img
              src={contato.animal.urlImagem}
              className="h-12 w-12 rounded-full object-cover"
            />

            <div className="flex-1">
              <p className="font-semibold">{contato.animal.nome}</p>
              <p className="text-[11px] text-gray-500 truncate">
                {contato.remetente?.nome ||
                  contato.cliente?.nome ||
                  "Remetente não informado"}
                {contato.destinatario?.nome
                  ? ` → ${contato.destinatario.nome}`
                  : ""}
              </p>
              {contato.codigoConversa && (
                <p className="text-[11px] text-gray-400">
                  🔒 conversa protegida
                </p>
              )}
              {admin?.role !== "admin" && (
                <p className="text-sm text-gray-500 truncate">
                  {contato.mensagem}
                </p>
              )}
            </div>
          </div>
        ))}
      </aside>

      {/* CHAT */}
      <main className="flex min-h-0 flex-1 flex-col">
        {!contatoSelecionado ? (
          <div className="flex flex-1 items-center justify-center p-6 text-center text-gray-500">
            Selecione uma conversa
          </div>
        ) : (
          <>
            {!conversaLiberada ? (
              <div className="flex flex-1 items-center justify-center p-4 sm:p-6">
                <div className="w-full max-w-md rounded-xl border bg-white p-5 shadow-sm sm:p-6">
                  <div className="text-sm text-gray-500 mb-2">
                    Conversa bloqueada
                  </div>

                  <h3 className="font-bold text-lg mb-2">
                    {contatoSelecionado.animal.nome}
                  </h3>

                  <p className="text-sm text-gray-600 mb-1">
                    Remetente:{" "}
                    {contatoSelecionado.remetente?.nome ||
                      contatoSelecionado.cliente?.nome ||
                      "Não informado"}
                  </p>

                  {contatoSelecionado.destinatario?.nome && (
                    <p className="text-sm text-gray-600 mb-4">
                      Destinatário: {contatoSelecionado.destinatario.nome}
                    </p>
                  )}

                  <p className="text-sm text-gray-600 mb-4">
                    Digite o código da conversa para liberar a visualização.
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
              <>
                {/* HEADER */}
                <header className="flex items-start justify-between gap-4 border-b bg-white p-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={contatoSelecionado.animal.urlImagem}
                      className="h-14 w-14 rounded-lg object-cover"
                    />
                    <div>
                      <h3 className="font-bold text-lg">
                        {contatoSelecionado.animal.nome}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {contatoSelecionado.animal.raca} •{" "}
                        {contatoSelecionado.animal.cidade}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setContatoSelecionado(null);
                      setConversaLiberada(false);
                      setCodigoInput("");
                      setMensagensLiberadas([]);
                    }}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                  >
                    Fechar
                  </button>
                </header>

                {/* MENSAGENS */}
                <div className="flex-1 min-h-0 space-y-4 overflow-y-auto p-3 sm:p-6">
                  {admin?.role === "admin" ? (
                    mensagensLiberadas.map((mensagem) => {
                      const enviadaPorMim = mensagem.remetente.id === admin.id;

                      return (
                        <div
                          key={mensagem.id}
                          className={`max-w-[85%] break-words whitespace-pre-wrap rounded-xl p-4 sm:max-w-lg ${
                            enviadaPorMim
                              ? "ml-auto bg-blue-600 text-white"
                              : "bg-white border"
                          }`}
                        >
                          <p className="text-[11px] font-semibold opacity-80 mb-1">
                            De: {mensagem.remetente.nome}
                            {mensagem.destinatario?.nome && (
                              <span className="font-normal">
                                {" "}
                                · Para: {mensagem.destinatario.nome}
                              </span>
                            )}
                          </p>
                          <p>{mensagem.mensagem}</p>
                          <span className="text-xs opacity-80 block mt-1">
                            {new Date(mensagem.criadoEm).toLocaleString()}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <>
                      <div className="max-w-[85%] break-words whitespace-pre-wrap rounded-xl bg-blue-600 p-4 text-white sm:max-w-lg">
                        <p>{contatoSelecionado.mensagem}</p>
                        <span className="text-xs opacity-80 block mt-1">
                          {dataDMA(contatoSelecionado.criadoEm)}
                        </span>
                      </div>

                      {contatoSelecionado.resposta && (
                        <div className="max-w-[85%] break-words whitespace-pre-wrap ml-auto rounded-xl bg-gray-300 p-4 sm:max-w-lg">
                          <p>{contatoSelecionado.resposta}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* INPUT (visual apenas por enquanto) */}
                <footer className="border-t bg-white p-3 sm:p-4">
                  <input
                    disabled
                    placeholder="Resposta via sistema (em breve)"
                    className="w-full rounded-lg border bg-gray-100 p-3"
                  />
                </footer>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
