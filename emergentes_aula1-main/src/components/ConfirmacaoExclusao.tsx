type Props = {
  aberto: boolean;
  titulo: string;
  mensagem: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  onConfirmar: () => void;
  onCancelar: () => void;
};

export function ConfirmacaoExclusao({
  aberto,
  titulo,
  mensagem,
  textoConfirmar = "Excluir",
  textoCancelar = "Cancelar",
  onConfirmar,
  onCancelar,
}: Props) {
  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.8}
              stroke="currentColor"
              className="h-6 w-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2.25m0 3.75h.01M10.06 3.838l-6.482 11.25a1.5 1.5 0 001.302 2.25h12.964a1.5 1.5 0 001.302-2.25l-6.482-11.25a1.5 1.5 0 00-2.604 0z"
              />
            </svg>
          </div>

          <div>
            <h3 className="text-lg font-bold text-gray-900">{titulo}</h3>
            <p className="mt-1 text-sm leading-6 text-gray-600">{mensagem}</p>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancelar}
            className="rounded-xl border border-gray-300 px-4 py-2 font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            {textoCancelar}
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            className="rounded-xl bg-red-600 px-4 py-2 font-semibold text-white transition hover:bg-red-700"
          >
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}
