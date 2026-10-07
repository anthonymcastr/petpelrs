import { lazy, Suspense, useEffect, useState } from "react";
import { createPortal } from "react-dom";

// O mapa (e o Leaflet) só é baixado quando alguém abre a janela
const MapaAnimal = lazy(() => import("./MapaAnimal"));

type Props = {
  nome: string;
  urlImagem: string;
  latitude?: number | null;
  longitude?: number | null;
  variante?: "icone" | "botao";
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
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M12 21s-7-6.2-7-11a7 7 0 0114 0c0 4.8-7 11-7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

export function Localizacao({
  nome,
  urlImagem,
  latitude,
  longitude,
  variante = "icone",
}: Props) {
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAberto(false);
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [aberto]);

  // Animais antigos ou sem endereço não mostram o botão
  if (latitude == null || longitude == null) return null;

  const gatilho =
    variante === "icone" ? (
      <button
        type="button"
        onClick={() => setAberto(true)}
        aria-label={`Ver localização de ${nome} no mapa`}
        title="Ver no mapa"
        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/90 text-blue-900 shadow transition hover:scale-110 hover:bg-white"
      >
        <IconePino />
      </button>
    ) : (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-blue-900 py-2 font-semibold text-blue-900 transition hover:bg-blue-900 hover:text-white"
      >
        <IconePino />
        Ver no mapa
      </button>
    );

  // O modal vai para o <body> para não ser cortado pelo card nem pelo carrossel
  const modal =
    aberto &&
    createPortal(
      <div
        className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-4"
        onClick={() => setAberto(false)}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Localização aproximada de ${nome}`}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl animate-fade-in"
        >
          <div className="flex items-start justify-between gap-3 p-5 pb-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Onde {nome} está
              </h3>
              <p className="text-sm text-slate-500">
                Área aproximada, não é o ponto exato.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAberto(false)}
              aria-label="Fechar mapa"
              className="cursor-pointer rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          {/* "isolate" mantém as camadas internas do Leaflet dentro da janela */}
          <div className="isolate h-[55dvh] min-h-72 w-full bg-slate-100">
            <Suspense
              fallback={
                <div className="flex h-full items-center justify-center text-sm text-slate-500">
                  Carregando mapa...
                </div>
              }
            >
              <MapaAnimal
                latitude={latitude}
                longitude={longitude}
                nome={nome}
                urlImagem={urlImagem}
              />
            </Suspense>
          </div>
        </div>
      </div>,
      document.body,
    );

  return (
    <>
      {gatilho}
      {modal}
    </>
  );
}