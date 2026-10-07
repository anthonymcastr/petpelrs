import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
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
  lida?: boolean;

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

function horarioLista(iso: string) {
  const data = new Date(iso);
  const hoje = new Date();
  const ontem = new Date();
  ontem.setDate(hoje.getDate() - 1);

  if (data.toDateString() === hoje.toDateString()) {
    return data.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  if (data.toDateString() === ontem.toDateString()) return "Ontem";
  return data.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

export default function Inbox() {
  const { cliente } = useClienteStore();
  const isAdmin = cliente?.role === "admin";

  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
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

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/contatos/inbox/${cliente.id}`,
      );

      const data: Mensagem[] = await res.json();
      if (!Array.isArray(data)) return;

      setMensagens(data);
    } catch (err) {
      console.error("Erro ao carregar mensagens:", err);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    if (!cliente?.id) {
      setCarregando(false);
      return;
    }

    carregarMensagens();
    pollingRef.current = setInterval(carregarMensagens, 4000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [cliente?.id]);

  // =========================
  // AGRUPAR CONVERSAS
  // =========================
  const lista = useMemo(() => {
    const grupos: Record<string, Conversa> = {};

    mensagens.forEach((msg) => {
      if (!msg.animal || !msg.remetente || !msg.destinatario) return;

      const outro =
        msg.remetenteId === cliente?.id ? msg.destinatario : msg.remetente;

      const chave = `${msg.animal.id}-${outro.id}`;

      if (!grupos[chave]) {
        grupos[chave] = {
          animal: msg.animal,
          outroUsuario: outro,
          mensagens: [],
          codigoConversa: msg.codigoConversa,
        };
      }

      grupos[chave].mensagens.push(msg);
    });

    return Object.entries(grupos)
      .map(([chave, conv]) => {
        conv.mensagens.sort(
          (a, b) =>
            new Date(a.criadoEm).getTime() - new Date(b.criadoEm).getTime(),
        );
        const ultima = conv.mensagens[conv.mensagens.length - 1];
        const naoLidas = conv.mensagens.filter(
          (m) => m.destinatarioId === cliente?.id && !m.lida,
        ).length;

        return { chave, conv, ultima, naoLidas };
      })
      .sort(
        (a, b) =>
          new Date(b.ultima.criadoEm).getTime() -
          new Date(a.ultima.criadoEm).getTime(),
      );
  }, [mensagens, cliente?.id]);

  const filtradas = lista.filter(({ conv }) => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return true;
    return (
      conv.animal?.nome?.toLowerCase().includes(termo) ||
      conv.outroUsuario?.nome?.toLowerCase().includes(termo)
    );
  });

  const conversaAtual = conversaSelecionada
    ? (lista.find((l) => l.chave === conversaSelecionada)?.conv ?? null)
    : null;

  function fecharConversa() {
    setConversaSelecionada(null);
    setLiberada(false);
    setCodigoInput("");
  }

  // =========================
  // ADMIN: VALIDAR CÓDIGO
  // =========================
  function validarCodigo(e: React.FormEvent) {
    e.preventDefault();
    if (!conversaAtual) return;

    if (codigoInput === conversaAtual.codigoConversa) {
      setLiberada(true);
    } else {
      toast.error("Código inválido");
    }
  }

  // =========================
  // UI
  // =========================
  return (
    <div className="flex h-[calc(100dvh-4.5rem)] overflow-hidden bg-slate-100 md:h-[calc(100dvh-5rem)]">
      {/* =========================
          LISTA DE CONVERSAS
      ========================= */}
      <aside
        className={`${
          conversaAtual ? "hidden md:flex" : "flex"
        } w-full shrink-0 flex-col border-r border-slate-200 bg-white md:w-80 lg:w-96`}
      >
        <div className="border-b border-slate-200 p-4">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Mensagens
          </h1>

          {lista.length > 0 && (
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
          {!cliente ? (
            <div className="p-6 text-center text-sm text-slate-500">
              <p>Entre na sua conta para ver suas mensagens.</p>
              <Link
                to="/login"
                className="mt-4 inline-block rounded-xl bg-blue-900 px-5 py-2.5 font-semibold text-white transition hover:bg-blue-800"
              >
                Ir para o login
              </Link>
            </div>
          ) : carregando ? (
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
          ) : lista.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-500">
              <p className="font-medium text-slate-700">
                Nenhuma conversa ainda
              </p>
              <p className="mt-1">
                Abra o card de um animal e envie uma mensagem para o responsável.
              </p>
              <Link
                to="/"
                className="mt-4 inline-block rounded-xl bg-blue-900 px-5 py-2.5 font-semibold text-white transition hover:bg-blue-800"
              >
                Ver animais
              </Link>
            </div>
          ) : filtradas.length === 0 ? (
            <p className="p-6 text-center text-sm text-slate-500">
              Nenhuma conversa encontrada para essa busca.
            </p>
          ) : (
            <ul className="p-2">
              {filtradas.map(({ chave, conv, ultima, naoLidas }) => {
                const selecionada = chave === conversaSelecionada;

                return (
                  <li key={chave}>
                    <button
                      type="button"
                      onClick={() => {
                        setConversaSelecionada(chave);
                        setLiberada(false);
                        setCodigoInput("");
                      }}
                      aria-current={selecionada ? "true" : undefined}
                      className={`flex w-full cursor-pointer items-center gap-3 rounded-2xl p-3 text-left transition hover:bg-slate-100 ${
                        selecionada ? "bg-blue-50" : ""
                      }`}
                    >
                      <img
                        src={conv.animal.urlImagem}
                        alt=""
                        className="h-12 w-12 shrink-0 rounded-full bg-slate-200 object-cover"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <strong className="truncate text-slate-900">
                            {conv.animal.nome}
                          </strong>
                          <span
                            className={`shrink-0 text-xs ${
                              naoLidas > 0
                                ? "font-semibold text-blue-900"
                                : "text-slate-400"
                            }`}
                          >
                            {ultima && horarioLista(ultima.criadoEm)}
                          </span>
                        </div>

                        <p className="truncate text-xs text-slate-500">
                          {conv.outroUsuario?.nome}
                        </p>

                        <div className="mt-0.5 flex items-center justify-between gap-2">
                          <p
                            className={`truncate text-sm ${
                              naoLidas > 0
                                ? "font-medium text-slate-800"
                                : "text-slate-500"
                            }`}
                          >
                            {ultima?.mensagem}
                          </p>
                          {naoLidas > 0 && (
                            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-blue-900 px-1.5 text-xs font-bold text-white">
                              {naoLidas > 99 ? "99+" : naoLidas}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      {/* =========================
          ÁREA PRINCIPAL
      ========================= */}
      <main
        className={`${
          conversaAtual ? "flex" : "hidden md:flex"
        } min-w-0 flex-1 flex-col`}
      >
        {!conversaAtual ? (
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
            <p className="mt-1 text-sm text-slate-500">
              Suas mensagens aparecem aqui.
            </p>
          </div>
        ) : isAdmin && !liberada ? (
          // 🔐 ADMIN BLOQUEADO
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
                onSubmit={validarCodigo}
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
                  Digite o código da conversa sobre{" "}
                  <b>{conversaAtual.animal?.nome}</b> para liberar a
                  visualização.
                </p>

                <input
                  value={codigoInput}
                  onChange={(e) => setCodigoInput(e.target.value)}
                  placeholder="Código da conversa"
                  aria-label="Código da conversa"
                  className="mt-5 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-center text-slate-900 placeholder:text-slate-400 focus:border-blue-700 focus:outline-2 focus:outline-offset-0 focus:outline-blue-200"
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
          // 💬 CHAT LIBERADO
          <ChatJanela
            key={conversaSelecionada}
            conversa={conversaAtual}
            usuarioId={cliente?.id}
            onClose={fecharConversa}
            onEnviada={carregarMensagens}
          />
        )}
      </main>
    </div>
  );
}