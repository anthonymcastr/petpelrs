import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";

type Props = {
  id: number;
  nome: string;
  tipo: string;
  variante?: "icone" | "botao";
};

function montarTexto(nome: string, tipo: string) {
  if (tipo === "PERDIDO")
    return `Ajude a encontrar ${nome}! Pet perdido em Pelotas.`;
  if (tipo === "ENCONTRADO")
    return `${nome} foi encontrado em Pelotas. Você reconhece este pet?`;
  return `${nome} está para adoção em Pelotas. Que tal dar um lar?`;
}

function IconeCompartilhar() {
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
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
    </svg>
  );
}

export function Compartilhar({ id, nome, tipo, variante = "icone" }: Props) {
  const [aberto, setAberto] = useState(false);

  const url = `${window.location.origin}/?animal=${id}`;
  const texto = montarTexto(nome, tipo);
  const podeNativo = typeof navigator !== "undefined" && "share" in navigator;

  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAberto(false);
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [aberto]);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copiado!");
      setAberto(false);
    } catch {
      toast.error("Não foi possível copiar o link");
    }
  };

  const compartilharNativo = async () => {
    try {
      await navigator.share({ title: `PetPel RS - ${nome}`, text: texto, url });
      setAberto(false);
    } catch {
      // usuário cancelou o compartilhamento
    }
  };

  const redes = [
    {
      nome: "WhatsApp",
      img: "/img/logozap.png",
      href: `https://wa.me/?text=${encodeURIComponent(`${texto} ${url}`)}`,
    },
    {
      nome: "Facebook",
      img: "/img/face-logo.png",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    },
    {
      nome: "LinkedIn",
      img: "/img/linkedin-logo.png",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    },
  ];

  const gatilho =
    variante === "icone" ? (
      <button
        type="button"
        onClick={() => setAberto(true)}
        aria-label={`Compartilhar ${nome}`}
        title="Compartilhar"
        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/90 text-blue-900 shadow transition hover:scale-110 hover:bg-white"
      >
        <IconeCompartilhar />
      </button>
    ) : (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-blue-900 py-2 font-semibold text-blue-900 transition hover:bg-blue-900 hover:text-white"
      >
        <IconeCompartilhar />
        Compartilhar
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
          aria-label={`Compartilhar ${nome}`}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl animate-fade-in"
        >
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Compartilhar</h3>
              <p className="text-sm text-slate-500">{nome}</p>
            </div>
            <button
              type="button"
              onClick={() => setAberto(false)}
              aria-label="Fechar"
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

          <div className="grid grid-cols-3 gap-3">
            {redes.map((rede) => (
              <a
                key={rede.nome}
                href={rede.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setAberto(false)}
                className="flex flex-col items-center gap-2 rounded-xl p-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                  <img src={rede.img} alt="" className="h-7 w-7 object-contain" />
                </span>
                {rede.nome}
              </a>
            ))}
          </div>

          <div className="mt-5 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2">
            <input
              readOnly
              value={url}
              onFocus={(e) => e.currentTarget.select()}
              aria-label="Link do animal"
              className="min-w-0 flex-1 bg-transparent px-2 text-sm text-slate-600 outline-none"
            />
            <button
              type="button"
              onClick={copiar}
              className="cursor-pointer rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800"
            >
              Copiar
            </button>
          </div>

          {podeNativo && (
            <button
              type="button"
              onClick={compartilharNativo}
              className="mt-3 w-full cursor-pointer rounded-xl border border-slate-300 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Mais opções
            </button>
          )}
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