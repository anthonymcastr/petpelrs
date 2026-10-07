import type { Animal } from "../utils/animalType";
import { Compartilhar } from "./Compartilhar";
import { Localizacao } from "./Localizacao";

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
  const tipo = tipoConfig[data.tipo] ?? {
    label: data.tipo,
    badge: "bg-gray-600",
  };

  const chip = data.chip || "Não contém";
  const temChip = chip !== "Não contém";

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
          title={temChip ? "Código do microchip" : "Animal sem microchip informado"}
        >
          <IconeChip />
          <span className="font-normal text-slate-500">Chip:</span>
          <span className={`truncate ${temChip ? "font-mono tracking-wide" : ""}`}>
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
        </div>
      </div>
    </article>
  );
}