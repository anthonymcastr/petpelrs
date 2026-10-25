import { useState } from "react";

type Props = { fotos: string[]; alt: string; grande?: boolean };

export function GaleriaFotos({ fotos, alt, grande = false }: Props) {
  const [indice, setIndice] = useState(0);
  const total = fotos.length;
  const atual = fotos[Math.min(indice, Math.max(total - 1, 0))];

  if (!atual) return null;

  function navegar(delta: number) {
    setIndice((valor) => (valor + delta + total) % total);
  }

  return (
    <div className="absolute inset-0 overflow-hidden">
      <img src={atual} alt={`${alt}${total > 1 ? `, foto ${indice + 1} de ${total}` : ""}`} className="h-full w-full object-cover" />
      {total > 1 && (
        <>
          <button type="button" onClick={(event) => { event.stopPropagation(); navegar(-1); }} aria-label="Foto anterior" className="absolute left-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-xl font-bold text-blue-900 shadow hover:bg-white">‹</button>
          <button type="button" onClick={(event) => { event.stopPropagation(); navegar(1); }} aria-label="Próxima foto" className="absolute right-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-xl font-bold text-blue-900 shadow hover:bg-white">›</button>
          <span className={`absolute right-3 rounded-full bg-black/60 px-2 py-0.5 text-xs font-semibold text-white ${grande ? "top-3" : "bottom-3"}`}>{indice + 1}/{total}</span>
          {grande && <div className="absolute inset-x-0 bottom-0 flex gap-2 overflow-x-auto bg-gradient-to-t from-black/60 to-transparent p-3 pt-8">{fotos.map((foto, fotoIndice) => <button key={`${foto}-${fotoIndice}`} type="button" onClick={() => setIndice(fotoIndice)} className={`h-12 w-12 shrink-0 overflow-hidden rounded-lg ring-2 ${fotoIndice === indice ? "ring-white" : "opacity-70 ring-transparent"}`}><img src={foto} alt="" className="h-full w-full object-cover" /></button>)}</div>}
        </>
      )}
    </div>
  );
}
