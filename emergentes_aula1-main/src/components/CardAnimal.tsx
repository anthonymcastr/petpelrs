import { useState } from "react";
import { toast } from "sonner";
import type { Animal } from "../utils/animalType";
import { Compartilhar } from "./Compartilhar";
import { Localizacao } from "./Localizacao";
import { useClienteStore } from "../context/ClienteContext";
import { useAdminStore } from "../Admin/context/AdminContext";

type CardAnimalProps = {
  data: Animal;
  onFazerContato?: () => void;
  onExcluir?: (id: number) => void;
  isAdmin?: boolean;
};

const tipoConfig: Record<string, { label: string; badge: string }> = {
  PERDIDO: { label: "Perdido", badge: "bg-red-600" },
  ENCONTRADO: { label: "Encontrado", badge: "bg-emerald-600" },
  ADOCAO: { label: "Adoção", badge: "bg-blue-700" },
};

function IconeChip({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="6" y="6" width="12" height="12" rx="2" />
      <rect x="10" y="10" width="4" height="4" rx="0.5" />
      <path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3" />
    </svg>
  );
}

export function CardAnimal({
  data,
  onFazerContato,
  onExcluir,
  isAdmin,
}: CardAnimalProps) {
  const { cliente } = useClienteStore();
  const { admin } = useAdminStore();
  const [abrirSolicitacao, setAbrirSolicitacao] = useState(false);
  const [descricao, setDescricao] = useState("");
  const [enviandoSolicitacao, setEnviandoSolicitacao] = useState(false);

  const tipo = tipoConfig[data.tipo] ?? {
    label: data.tipo,
    badge: "bg-gray-600",
  };

  const chip = data.chip || "Não contém";
  const temChip = chip !== "Não contém";
  const ehDono =
    Number(cliente?.id) === Number(data.usuario?.id ?? data.usuarioId);
  const podeSolicitarArquivamento = ehDono || isAdmin;

  const solicitarArquivamento = async () => {
    console.info("[arquivamento] Clique no botão", {
      animalId: data.id,
      animalTipo: data.tipo,
      clienteId: cliente?.id,
      temTokenCliente: Boolean(cliente?.token),
      adminId: admin?.id,
      temTokenAdmin: Boolean(admin?.token),
      ehDono,
      isAdmin: Boolean(isAdmin),
    });
    if (isAdmin) {
      if (!window.confirm(`Arquivar ${data.nome} agora?`)) return;

      try {
        setEnviandoSolicitacao(true);
        const endpoint = `${import.meta.env.VITE_API_URL}/arquivamento/animais/${data.id}`;
        console.info("[arquivamento] Admin enviando solicitação direta", {
          endpoint,
          animalId: data.id,
          adminId: admin?.id,
        });
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${admin?.token || ""}`,
          },
          body: JSON.stringify({
            descricao: "Arquivamento realizado diretamente pelo administrador.",
          }),
        });
        const corpo = await res.text();
        let resposta: { erro?: string } = {};
        try {
          resposta = corpo ? JSON.parse(corpo) : {};
        } catch {
          console.error("[arquivamento] API retornou corpo não JSON", {
            corpo,
          });
        }
        console.info("[arquivamento] Resposta do admin", {
          status: res.status,
          ok: res.ok,
          corpo: resposta,
        });
        if (!res.ok)
          throw new Error(resposta.erro || `Falha HTTP ${res.status}`);
        toast.success("Animal arquivado com sucesso");
        setAbrirSolicitacao(false);
      } catch (error) {
        console.error("[arquivamento] Falha no envio direto do admin", error);
        toast.error(
          error instanceof Error ? error.message : "Erro ao arquivar animal",
        );
      } finally {
        setEnviandoSolicitacao(false);
      }
      return;
    }

    if (!cliente?.token) {
      console.error("[arquivamento] Clique bloqueado: cliente sem token", {
        clienteId: cliente?.id,
        cliente: cliente
          ? { id: cliente.id, email: cliente.email, role: cliente.role }
          : null,
      });
      toast.error(
        "Sua sessão não possui um token válido. Saia e entre novamente.",
      );
      return;
    }
    if (descricao.trim().length < 5) {
      toast.error("Descreva o motivo com pelo menos 5 caracteres");
      return;
    }

    try {
      setEnviandoSolicitacao(true);
      const endpoint = `${import.meta.env.VITE_API_URL}/arquivamento/animais/${data.id}`;
      console.info("[arquivamento] Usuário enviando solicitação", {
        endpoint,
        animalId: data.id,
        usuarioId: cliente.id,
        descricaoCaracteres: descricao.trim().length,
      });
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cliente.token}`,
        },
        body: JSON.stringify({ descricao: descricao.trim() }),
      });
      const corpo = await res.text();
      let resposta: { erro?: string } = {};
      try {
        resposta = corpo ? JSON.parse(corpo) : {};
      } catch {
        console.error("[arquivamento] API retornou corpo não JSON", { corpo });
      }
      console.info("[arquivamento] Resposta da solicitação", {
        status: res.status,
        ok: res.ok,
        corpo: resposta,
      });
      if (!res.ok) throw new Error(resposta.erro || `Falha HTTP ${res.status}`);

      toast.success("Solicitação enviada para análise do administrador");
      setDescricao("");
      setAbrirSolicitacao(false);
    } catch (error) {
      console.error("[arquivamento] Falha no envio da solicitação", error);
      toast.error(
        error instanceof Error ? error.message : "Erro ao enviar solicitação",
      );
    } finally {
      setEnviandoSolicitacao(false);
    }
  };

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-[0_10px_30px_-12px_rgba(30,64,175,0.35)] ring-1 ring-slate-200/70 transition duration-300 hover:-translate-y-2 hover:shadow-[0_24px_45px_-15px_rgba(30,64,175,0.45)] motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      {/* Imagem */}
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <img
          src={data.urlImagem}
          alt={data.nome}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent" />

        <span
          className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold text-white shadow ${tipo.badge}`}
        >
          {tipo.label}
        </span>

        {/* Localização e compartilhar */}
        <div className="absolute right-3 top-3 flex gap-2">
          <Localizacao
            nome={data.nome}
            urlImagem={data.urlImagem}
            latitude={data.latitude}
            longitude={data.longitude}
          />
          <Compartilhar id={data.id} nome={data.nome} tipo={data.tipo} />
        </div>
      </div>

      {/* Conteúdo */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="truncate text-xl font-bold text-slate-900">
          {data.nome}
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          {data.raca}
          {data.idade != null &&
            ` · ${data.idade} ${data.idade === 1 ? "ano" : "anos"}`}
        </p>

        {/* Chip */}
        <p
          className={`mt-3 flex items-center gap-1.5 text-xs ${
            temChip ? "font-semibold text-blue-900" : "text-slate-400"
          }`}
          title={
            temChip ? "Código do microchip" : "Animal sem microchip informado"
          }
        >
          <IconeChip />
          <span className="font-normal text-slate-500">Chip:</span>
          <span
            className={`truncate ${temChip ? "font-mono tracking-wide" : ""}`}
          >
            {chip}
          </span>
        </p>

        <div className="mt-auto space-y-2 pt-5">
          <button
            type="button"
            onClick={onFazerContato}
            className="w-full cursor-pointer rounded-xl bg-blue-900 py-2.5 font-semibold text-white transition hover:bg-blue-800"
          >
            Ver detalhes
          </button>

          {isAdmin && onExcluir && (
            <button
              type="button"
              onClick={() => onExcluir(data.id)}
              className="w-full cursor-pointer rounded-xl border border-red-200 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-600 hover:text-white"
            >
              Excluir
            </button>
          )}

          {podeSolicitarArquivamento && (
            <button
              type="button"
              onClick={() => setAbrirSolicitacao(true)}
              className="w-full cursor-pointer rounded-xl border border-emerald-200 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-600 hover:text-white"
            >
              {isAdmin ? "Arquivar animal" : "Solicitar arquivamento"}
            </button>
          )}
        </div>
      </div>

      {abrirSolicitacao && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4"
          onClick={() => !enviandoSolicitacao && setAbrirSolicitacao(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Solicitar arquivamento"
            className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-slate-900">
              Solicitar arquivamento
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {isAdmin
                ? "O animal será retirado do sistema imediatamente."
                : "O administrador vai analisar o pedido antes de retirar este animal do sistema."}
            </p>
            <label className="mt-5 block text-sm font-semibold text-slate-700">
              {isAdmin ? "Observação do arquivamento" : "Motivo da solicitação"}
              <textarea
                value={descricao}
                onChange={(event) => setDescricao(event.target.value)}
                rows={4}
                maxLength={500}
                placeholder={
                  isAdmin
                    ? "Opcional"
                    : "Ex.: o animal foi encontrado pelo responsável..."
                }
                className="mt-2 w-full resize-none rounded-2xl border border-slate-300 p-3 font-normal outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              />
            </label>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setAbrirSolicitacao(false)}
                disabled={enviandoSolicitacao}
                className="rounded-xl border border-slate-300 px-4 py-2.5 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={solicitarArquivamento}
                disabled={enviandoSolicitacao}
                className="rounded-xl bg-emerald-600 px-4 py-2.5 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {enviandoSolicitacao
                  ? "Processando..."
                  : isAdmin
                    ? "Confirmar arquivamento"
                    : "Confirmar solicitação"}
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
