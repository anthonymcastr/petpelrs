import { useEffect, useMemo, useState } from "react";
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

function nomeRemetente(c: ContatoType) {
  return c.remetente?.nome || c.cliente?.nome || "Remetente não informado";
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

function hora(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Contato() {
  const [contatos, setContatos] = useState<ContatoType[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [contatoSelecionado, setContatoSelecionado] =
    useState<ContatoType | null>(null);
  const [codigoInput, setCodigoInput] = useState("");
  const [conversaLiberada, setConversaLiberada] = useState(false);
  const [mensagensLiberadas, setMensagensLiberadas] = useState<
    MensagemConversa[]
  >([]);

  const { cliente } = useClienteStore();
  const { admin } = useAdminStore();
  const isAdmin = admin?.role === "admin";

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
      } finally {
        setCarregando(false);
      }
    }
    buscar();
  }, [admin, cliente]);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return contatos;
    return contatos.filter(
      (c) =>
        c.animal?.nome?.toLowerCase().includes(termo) ||
        nomeRemetente(c).toLowerCase().includes(termo) ||
        c.destinatario?.nome?.toLowerCase().includes(termo),
    );
  }, [contatos, busca]);

  function dataDMA(data: string) {
    return new Date(data).toLocaleDateString("pt-BR");
  }

  function fecharConversa() {
    setContatoSelecionado(null);
    setConversaLiberada(false);
    setCodigoInput("");
    setMensagensLiberadas([]);
  }

  async function liberarConversa(e?: React.FormEvent) {
    e?.preventDefault();

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
    <div className="flex h-[calc(100dvh-4.5rem)] overflow-hidden bg-slate-100 md:h-[calc(100dvh-5rem)]">
      {/* SIDEBAR */}
      <aside
        className={`${
          contatoSelecionado ? "hidden md:flex" : "flex"
        } w-full shrink-0 flex-col border-r border-slate-200 bg-white md:w-80 lg:w-96`}
      >
        <div className="border-b border-slate-200 p-4">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Conversas
          </h1>

          {contatos.length > 0 && (
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por animal ou pessoa"
              aria-label="Buscar conversas"
              className="mt-3 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-700 focus:outline-2 focus:outline-offset-0 focus:outline-blue-200"
            />
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {carregando ? (
            <div className="space-y-1 p-3">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex animate-pulse gap-3 rounded-2xl p-3"
                >
                  <div className="h-12 w-12 rounded-full bg-slate-200" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-3 w-1/2 rounded bg-slate-200" />
                    <div className="h-3 w-3/4 rounded bg-slate-200" />
                  </div>
                </div>
              ))}
            </div>
          ) : contatos.length === 0 ? (
            <p className="p-6 text-center text-sm text-slate-500">
              Nenhuma conversa encontrada.
            </p>
          ) : filtrados.length === 0 ? (
            <p className="p-6 text-center text-sm text-slate-500">
              Nenhuma conversa encontrada para essa busca.
            </p>
          ) : (
            <ul className="p-2">
              {filtrados.map((contato) => {
                const selecionado = contatoSelecionado?.id === contato.id;

                return (
                  <li key={contato.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setContatoSelecionado(contato);
                        setCodigoInput("");
                        setConversaLiberada(false);
                        setMensagensLiberadas([]);
                      }}
                      aria-current={selecionado ? "true" : undefined}
                      className={`flex w-full cursor-pointer items-center gap-3 rounded-2xl p-3 text-left transition hover:bg-slate-100 ${
                        selecionado ? "bg-blue-50" : ""
                      }`}
                    >
                      <img
                        src={contato.animal.urlImagem}
                        alt=""
                        className="h-12 w-12 shrink-0 rounded-full bg-slate-200 object-cover"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <strong className="truncate text-slate-900">
                            {contato.animal.nome}
                          </strong>
                          <span className="shrink-0 text-xs text-slate-400">
                            {dataDMA(contato.criadoEm)}
                          </span>
                        </div>

                        <p className="truncate text-xs text-slate-500">
                          {nomeRemetente(contato)}
                          {contato.destinatario?.nome
                            ? ` → ${contato.destinatario.nome}`
                            : ""}
                        </p>

                        {contato.codigoConversa && (
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={2}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-3.5 w-3.5"
                              aria-hidden="true"
                            >
                              <rect x="4" y="11" width="16" height="10" rx="2" />
                              <path d="M8 11V7a4 4 0 018 0v4" />
                            </svg>
                            Conversa protegida
                          </p>
                        )}

                        {!isAdmin && (
                          <p className="mt-0.5 truncate text-sm text-slate-500">
                            {contato.mensagem}
                          </p>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      {/* CHAT */}
      <main
        className={`${
          contatoSelecionado ? "flex" : "hidden md:flex"
        } min-h-0 min-w-0 flex-1 flex-col`}
      >
        {!contatoSelecionado ? (
          <div className="flex h-full flex-col items-center justify-center p-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-blue-900 shadow ring-1 ring-slate-200">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-7 w-7"
                aria-hidden="true"
              >
                <path d="M21 12a8 8 0 01-11.6 7.1L4 20l1-4.6A8 8 0 1121 12z" />
              </svg>
            </div>
            <p className="mt-4 font-semibold text-slate-700">
              Selecione uma conversa
            </p>
          </div>
        ) : !conversaLiberada ? (
          <div className="flex h-full flex-col">
            <div className="p-3 md:hidden">
              <button
                type="button"
                onClick={fecharConversa}
                className="flex cursor-pointer items-center gap-1 rounded-full px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
              >
                ← Voltar
              </button>
            </div>

            <div className="flex flex-1 items-center justify-center p-4">
              <form
                onSubmit={liberarConversa}
                className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-xl ring-1 ring-slate-200 sm:p-8"
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-900">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-7 w-7"
                    aria-hidden="true"
                  >
                    <rect x="4" y="11" width="16" height="10" rx="2" />
                    <path d="M8 11V7a4 4 0 018 0v4" />
                  </svg>
                </div>

                <h2 className="mt-4 text-lg font-bold text-slate-900">
                  Conversa protegida
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Conversa sobre <b>{contatoSelecionado.animal.nome}</b>
                </p>

                <dl className="mt-4 space-y-1 rounded-2xl bg-slate-50 p-4 text-left text-sm ring-1 ring-slate-200/70">
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">Remetente</dt>
                    <dd className="truncate font-medium text-slate-800">
                      {nomeRemetente(contatoSelecionado)}
                    </dd>
                  </div>
                  {contatoSelecionado.destinatario?.nome && (
                    <div className="flex justify-between gap-3">
                      <dt className="text-slate-500">Destinatário</dt>
                      <dd className="truncate font-medium text-slate-800">
                        {contatoSelecionado.destinatario.nome}
                      </dd>
                    </div>
                  )}
                </dl>

                <p className="mt-4 text-sm text-slate-600">
                  Digite o código da conversa para liberar a visualização.
                </p>

                <input
                  value={codigoInput}
                  onChange={(e) => setCodigoInput(e.target.value)}
                  placeholder="Código da conversa"
                  aria-label="Código da conversa"
                  className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-center text-slate-900 placeholder:text-slate-400 focus:border-blue-700 focus:outline-2 focus:outline-offset-0 focus:outline-blue-200"
                />

                <button
                  type="submit"
                  className="mt-3 w-full cursor-pointer rounded-xl bg-blue-900 py-3 font-semibold text-white transition hover:bg-blue-800"
                >
                  Liberar conversa
                </button>
              </form>
            </div>
          </div>
        ) : (
          <>
            {/* HEADER */}
            <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-3 py-3 sm:px-5">
              <button
                type="button"
                onClick={fecharConversa}
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

              <img
                src={contatoSelecionado.animal.urlImagem}
                alt=""
                className="h-11 w-11 shrink-0 rounded-xl object-cover"
              />

              <div className="min-w-0 flex-1">
                <h2 className="truncate font-bold leading-tight text-slate-900">
                  {contatoSelecionado.animal.nome}
                </h2>
                <p className="truncate text-sm text-slate-500">
                  {contatoSelecionado.animal.raca} ·{" "}
                  {contatoSelecionado.animal.cidade}
                </p>
              </div>
            </header>

            {/* MENSAGENS */}
            <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 px-3 py-4 sm:px-6">
              {isAdmin ? (
                mensagensLiberadas.length === 0 ? (
                  <p className="py-10 text-center text-sm text-slate-500">
                    Nenhuma mensagem nesta conversa.
                  </p>
                ) : (
                  mensagensLiberadas.map((mensagem, i) => {
                    const anterior = mensagensLiberadas[i - 1];
                    const enviadaPorMim = mensagem.remetente.id === admin?.id;
                    const novoDia =
                      !anterior ||
                      new Date(anterior.criadoEm).toDateString() !==
                        new Date(mensagem.criadoEm).toDateString();
                    const mudouRemetente =
                      novoDia ||
                      anterior.remetente.id !== mensagem.remetente.id;

                    return (
                      <div key={mensagem.id}>
                        {novoDia && (
                          <div className="my-4 flex justify-center">
                            <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-500 shadow-sm ring-1 ring-slate-200">
                              {rotuloDia(mensagem.criadoEm)}
                            </span>
                          </div>
                        )}

                        <div
                          className={`flex flex-col ${
                            enviadaPorMim ? "items-end" : "items-start"
                          } ${mudouRemetente ? "mt-3" : "mt-1"}`}
                        >
                          {mudouRemetente && (
                            <span className="mb-1 mx-2 text-xs font-semibold text-slate-500">
                              {mensagem.remetente.nome}
                              {mensagem.destinatario?.nome && (
                                <span className="font-normal">
                                  {" "}
                                  para {mensagem.destinatario.nome}
                                </span>
                              )}
                            </span>
                          )}

                          <div
                            className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-sm shadow-sm sm:max-w-md md:max-w-lg ${
                              enviadaPorMim
                                ? "rounded-br-md bg-blue-900 text-white"
                                : "rounded-bl-md bg-white text-slate-800 ring-1 ring-slate-200"
                            }`}
                          >
                            <p>{mensagem.mensagem}</p>
                            <span
                              className={`mt-1 block text-right text-[11px] ${
                                enviadaPorMim
                                  ? "text-blue-200"
                                  : "text-slate-400"
                              }`}
                            >
                              {hora(mensagem.criadoEm)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-center">
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-500 shadow-sm ring-1 ring-slate-200">
                      {rotuloDia(contatoSelecionado.criadoEm)}
                    </span>
                  </div>

                  <div className="flex justify-end">
                    <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-blue-900 px-4 py-2.5 text-sm text-white shadow-sm sm:max-w-md md:max-w-lg">
                      <p>{contatoSelecionado.mensagem}</p>
                      <span className="mt-1 block text-right text-[11px] text-blue-200">
                        {hora(contatoSelecionado.criadoEm)}
                      </span>
                    </div>
                  </div>

                  {contatoSelecionado.resposta && (
                    <div className="flex justify-start">
                      <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-bl-md bg-white px-4 py-2.5 text-sm text-slate-800 shadow-sm ring-1 ring-slate-200 sm:max-w-md md:max-w-lg">
                        <p>{contatoSelecionado.resposta}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* INPUT (visual apenas por enquanto) */}
            <footer className="border-t border-slate-200 bg-white p-3 sm:p-4">
              <input
                disabled
                placeholder="Resposta via sistema (em breve)"
                aria-label="Resposta via sistema (em breve)"
                className="w-full cursor-not-allowed rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-500 placeholder:text-slate-400"
              />
            </footer>
          </>
        )}
      </main>
    </div>
  );
}