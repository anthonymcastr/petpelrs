import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

type Props = {
  children: ReactNode[];
};

export function Carrossel({ children }: Props) {
  const trilho = useRef<HTMLDivElement>(null);
  const [podeVoltar, setPodeVoltar] = useState(false);
  const [podeAvancar, setPodeAvancar] = useState(false);

  const atualizar = useCallback(() => {
    const el = trilho.current;
    if (!el) return;
    setPodeVoltar(el.scrollLeft > 8);
    setPodeAvancar(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    atualizar();
    window.addEventListener("resize", atualizar);
    return () => window.removeEventListener("resize", atualizar);
  }, [atualizar, children.length]);

  const mover = (sentido: 1 | -1) => {
    const el = trilho.current;
    if (!el) return;
    el.scrollBy({ left: sentido * el.clientWidth * 0.8, behavior: "smooth" });
  };

  const seta =
    "absolute top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white text-blue-900 shadow-xl ring-1 ring-black/5 transition hover:scale-110 hover:bg-blue-900 hover:text-white md:flex";

  return (
    <div className="relative mx-auto w-full max-w-7xl">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-slate-50 to-transparent md:w-16" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-slate-50 to-transparent md:w-16" />

      {podeVoltar && (
        <button
          type="button"
          onClick={() => mover(-1)}
          aria-label="Ver cards anteriores"
          className={`${seta} left-2`}
        >
          <Seta direcao="esq" />
        </button>
      )}
      {podeAvancar && (
        <button
          type="button"
          onClick={() => mover(1)}
          aria-label="Ver próximos cards"
          className={`${seta} right-2`}
        >
          <Seta direcao="dir" />
        </button>
      )}

      <div
        ref={trilho}
        onScroll={atualizar}
        className="flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth px-6 pb-10 pt-6 md:px-16 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children.map((filho, i) => (
          <div key={i} className="w-[270px] shrink-0 snap-center sm:w-[300px]">
            {filho}
          </div>
        ))}
      </div>
    </div>
  );
}

function Seta({ direcao }: { direcao: "esq" | "dir" }) {
  return (
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
      <path d={direcao === "esq" ? "M15 18l-6-6 6-6" : "M9 6l6 6-6 6"} />
    </svg>
  );
}