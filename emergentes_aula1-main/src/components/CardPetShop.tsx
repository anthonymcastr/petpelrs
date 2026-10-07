import { Link } from "react-router-dom";
import type { PetshopType } from "../utils/petshopType";

type Props = {
  petshop: PetshopType;
};

function IconePino() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 shrink-0"
      aria-hidden="true"
    >
      <path d="M12 21s-7-6.2-7-11a7 7 0 0114 0c0 4.8-7 11-7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

export function CardPetshop({ petshop }: Props) {
  const qtd = petshop.servicos.length;
  const destaques = petshop.servicos.slice(0, 3);
  const restantes = qtd - destaques.length;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-[0_10px_30px_-12px_rgba(30,64,175,0.35)] ring-1 ring-slate-200/70 transition duration-300 hover:-translate-y-2 hover:shadow-[0_24px_45px_-15px_rgba(30,64,175,0.45)] motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      {/* Imagem */}
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
        {petshop.logoUrl ? (
          <img
            src={petshop.logoUrl}
            alt={`Fachada ou logo da ${petshop.nome}`}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-900 to-blue-600 text-6xl font-extrabold text-white/90"
            aria-hidden="true"
          >
            {petshop.nome.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-blue-900 shadow">
          Parceiro
        </span>
      </div>

      {/* Conteúdo */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="truncate text-xl font-bold text-slate-900">
          {petshop.nome}
        </h3>

        {petshop.descricao && (
          <p className="mt-1 line-clamp-2 text-sm text-slate-500">
            {petshop.descricao}
          </p>
        )}

        {petshop.endereco && (
          <p className="mt-3 flex items-start gap-1.5 text-xs text-slate-500">
            <IconePino />
            <span className="line-clamp-2">{petshop.endereco}</span>
          </p>
        )}

        {qtd > 0 && (
          <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Serviços">
            {destaques.map((s) => (
              <li
                key={s.id}
                className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-900"
              >
                {s.nome}
              </li>
            ))}
            {restantes > 0 && (
              <li className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                +{restantes}
              </li>
            )}
          </ul>
        )}

        <div className="mt-auto pt-5">
          <Link
            to={`/parceiros/${petshop.id}`}
            className="block w-full rounded-xl bg-blue-900 py-2.5 text-center font-semibold text-white transition hover:bg-blue-800"
          >
            Ver serviços
          </Link>
        </div>
      </div>
    </article>
  );
}