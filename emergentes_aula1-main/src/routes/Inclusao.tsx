import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { useEffect, useRef, useState } from "react";
import type { Animal } from "../utils/animalType";
import { useClienteStore } from "../context/ClienteContext";
import { prepararFoto, tamanhoLegivel } from "../utils/imagem";

const campo =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 transition focus:border-blue-700 focus:outline-2 focus:outline-offset-0 focus:outline-blue-200";

const TIPOS = [
  {
    valor: "ADOCAO",
    label: "Adoção",
    descricao: "Procura um lar",
    marcado:
      "peer-checked:border-blue-700 peer-checked:bg-blue-50 peer-checked:text-blue-900",
  },
  {
    valor: "PERDIDO",
    label: "Perdido",
    descricao: "Sumiu de casa",
    marcado:
      "peer-checked:border-red-600 peer-checked:bg-red-50 peer-checked:text-red-800",
  },
  {
    valor: "ENCONTRADO",
    label: "Encontrado",
    descricao: "Achei na rua",
    marcado:
      "peer-checked:border-emerald-600 peer-checked:bg-emerald-50 peer-checked:text-emerald-800",
  },
];

function Erro({ mensagem }: { mensagem?: string }) {
  if (!mensagem) return null;
  return <p className="mt-1.5 text-sm text-red-600">{mensagem}</p>;
}

function Rotulo({
  htmlFor,
  children,
  opcional,
}: {
  htmlFor?: string;
  children: React.ReactNode;
  opcional?: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-sm font-medium text-slate-700"
    >
      {children}{" "}
      {opcional ? (
        <span className="font-normal text-slate-400">(opcional)</span>
      ) : (
        <span className="text-red-500">*</span>
      )}
    </label>
  );
}

// Aceita espaços, pontos e traços no código; confere 5 a 20 letras/números
function chipValido(valor?: string | null) {
  if (!valor || !valor.trim()) return true;
  const limpo = valor.replace(/[\s.\-]/g, "");
  if (limpo.toLowerCase() === "nãocontém" || limpo.toLowerCase() === "naocontem")
    return true;
  return /^[A-Za-z0-9]{5,20}$/.test(limpo);
}

export default function Inclusao() {
  const { cliente } = useClienteStore();
  const navigate = useNavigate();
  const [alerta, setAlerta] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [foto, setFoto] = useState<File | null>(null);
  const [previa, setPrevia] = useState<string | null>(null);
  const [erroFoto, setErroFoto] = useState<string | null>(null);
  const [processandoFoto, setProcessandoFoto] = useState(false);
  const [arrastando, setArrastando] = useState(false);
  const inputArquivo = useRef<HTMLInputElement>(null);
  const inputCamera = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<Animal>();

  const API_URL = import.meta.env.VITE_API_URL;

  // 🔒 Preenche automaticamente o ID do usuário logado
  useEffect(() => {
    if (cliente?.id) {
      setValue("usuarioId", cliente.id);
    }
  }, [cliente, setValue]);

  // Prévia da foto escolhida (a URL temporária é liberada quando a foto muda)
  useEffect(() => {
    if (!foto) {
      setPrevia(null);
      return;
    }
    const url = URL.createObjectURL(foto);
    setPrevia(url);
    return () => URL.revokeObjectURL(url);
  }, [foto]);

  async function escolherFoto(arquivo?: File | null) {
    if (!arquivo) return;
    setErroFoto(null);
    setProcessandoFoto(true);
    try {
      setFoto(await prepararFoto(arquivo));
    } catch (error) {
      setErroFoto(
        error instanceof Error ? error.message : "Não foi possível usar essa foto.",
      );
    } finally {
      setProcessandoFoto(false);
    }
  }

  function aguardar(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function onSubmit(data: Animal) {
    if (!foto) {
      setErroFoto("Envie uma foto do animal");
      return;
    }

    const inicio = Date.now();
    setCarregando(true);

    try {
      // Envio como formulário (multipart) para poder levar o arquivo da foto
      const formData = new FormData();
      formData.append("tipo", data.tipo);
      formData.append("nome", data.nome);
      formData.append("raca", data.raca);
      formData.append("idade", String(data.idade));
      formData.append("cidade", data.cidade);
      formData.append("usuarioId", String(data.usuarioId));
      if (data.chip?.trim()) formData.append("chip", data.chip.trim());
      if (data.endereco?.trim()) formData.append("endereco", data.endereco.trim());
      formData.append("foto", foto, foto.name);

      // Sem "Content-Type": o navegador define sozinho, com o separador do multipart
      const resp = await fetch(`${API_URL}/animais`, {
        method: "POST",
        body: formData,
      });

      if (!resp.ok) {
        const corpo = await resp.json().catch(() => ({}));
        const msg =
          typeof corpo.erro === "string"
            ? corpo.erro
            : resp.status === 413
              ? "A foto é grande demais. Tente outra imagem."
              : "Não foi possível cadastrar o animal. Tente novamente.";
        setAlerta(msg);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      setAlerta(null);
      const tempoDecorrido = Date.now() - inicio;
      if (tempoDecorrido < 1200) {
        await aguardar(1200 - tempoDecorrido);
      }

      toast.success("Animal cadastrado com sucesso!", {
        duration: 4000,
      });
      reset();
      setFoto(null);
      navigate("/"); // volta pra listagem (home)
    } catch (error) {
      console.error(error);
      setAlerta("Erro ao cadastrar animal");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setCarregando(false);
    }
  }

  if (!cliente) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-xl ring-1 ring-slate-200">
          <h1 className="text-xl font-bold text-slate-900">
            Entre para cadastrar um animal
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Você precisa estar logado para publicar um pet na plataforma.
          </p>
          <Link
            to="/login"
            className="mt-6 block rounded-xl bg-blue-900 py-3 font-semibold text-white transition hover:bg-blue-800"
          >
            Ir para o login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
            Cadastrar animal
          </h1>
          <p className="mt-2 text-slate-600">
            Preencha os dados e publique o pet para que outras pessoas possam
            ajudar.
          </p>
        </header>

        {alerta && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-800 shadow animate-fade-in"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="mt-0.5 h-6 w-6 shrink-0"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2.25m0 3.75h.01m-6.938 4.5a9 9 0 1113.856 0H5.062z"
              />
            </svg>
            <span className="flex-1 font-medium">{alerta}</span>
            <button
              type="button"
              onClick={() => setAlerta(null)}
              aria-label="Fechar aviso"
              className="cursor-pointer text-xl leading-none text-red-500 transition hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid gap-8 rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200 md:grid-cols-5 md:p-10"
        >
          {/* Coluna dos dados */}
          <div className="grid content-start gap-5 md:col-span-3">
            {/* Tipo */}
            <fieldset>
              <legend className="mb-1.5 block text-sm font-medium text-slate-700">
                O que aconteceu? <span className="text-red-500">*</span>
              </legend>
              <div className="grid grid-cols-3 gap-3">
                {TIPOS.map((t) => (
                  <label key={t.valor} className="cursor-pointer">
                    <input
                      type="radio"
                      value={t.valor}
                      className="peer sr-only"
                      {...register("tipo", { required: "Tipo obrigatório" })}
                    />
                    <span
                      className={`flex h-full flex-col rounded-xl border border-slate-300 px-3 py-3 text-center text-slate-600 transition hover:bg-slate-50 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-blue-700 ${t.marcado}`}
                    >
                      <span className="font-semibold">{t.label}</span>
                      <span className="text-xs opacity-80">{t.descricao}</span>
                    </span>
                  </label>
                ))}
              </div>
              <Erro mensagem={errors.tipo?.message} />
            </fieldset>

            {/* Nome */}
            <div>
              <Rotulo htmlFor="nome">Nome do animal</Rotulo>
              <input
                id="nome"
                {...register("nome", { required: "Nome obrigatório" })}
                className={campo}
                placeholder="Ex: Thor"
              />
              <Erro mensagem={errors.nome?.message} />
            </div>

            {/* Raça e idade */}
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Rotulo htmlFor="raca">Raça</Rotulo>
                <input
                  id="raca"
                  {...register("raca", { required: "Raça obrigatória" })}
                  className={campo}
                  placeholder="Ex: Labrador"
                />
                <Erro mensagem={errors.raca?.message} />
              </div>

              <div>
                <Rotulo htmlFor="idade">Idade (anos)</Rotulo>
                <input
                  id="idade"
                  type="number"
                  min={0}
                  {...register("idade", {
                    required: "Idade obrigatória",
                    valueAsNumber: true,
                    min: { value: 0, message: "Idade inválida" },
                  })}
                  className={campo}
                  placeholder="Ex: 3"
                />
                <Erro mensagem={errors.idade?.message} />
              </div>
            </div>

            {/* Chip */}
            <div>
              <Rotulo htmlFor="chip" opcional>
                Chip do animal
              </Rotulo>
              <input
                id="chip"
                autoComplete="off"
                autoCapitalize="characters"
                {...register("chip", {
                  validate: (v) =>
                    chipValido(v) ||
                    "Use de 5 a 20 letras e números, sem símbolos",
                })}
                className={`${campo} uppercase placeholder:normal-case`}
                placeholder="Ex: 985112003456789"
              />
              <Erro mensagem={errors.chip?.message} />
              <p className="mt-1.5 text-xs text-slate-500">
                O código do microchip ajuda a identificar o dono. Se o animal não
                tem chip ou você não sabe, deixe em branco.
              </p>
            </div>

            {/* Cidade */}
            <div>
              <Rotulo htmlFor="cidade">Cidade</Rotulo>
              <select
                id="cidade"
                {...register("cidade", { required: "Cidade obrigatória" })}
                className={campo}
              >
                <option value="">Selecione</option>
                <option value="PELOTAS">Pelotas</option>
              </select>
              <Erro mensagem={errors.cidade?.message} />
            </div>

            {/* Endereço */}
            <div>
              <Rotulo htmlFor="endereco" opcional>
                Onde o animal está ou foi visto
              </Rotulo>
              <input
                id="endereco"
                autoComplete="off"
                {...register("endereco")}
                className={campo}
                placeholder="Ex: Rua Gonçalves Chaves, Centro"
              />
              <p className="mt-1.5 text-xs text-slate-500">
                Informe a rua e o bairro, <b>sem o número da casa</b>. O mapa
                mostra uma área aproximada, nunca o ponto exato.
              </p>
            </div>

            {/* Usuário (bloqueado) */}
            <div>
              <label
                htmlFor="responsavel"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Responsável pelo anúncio
              </label>
              <input
                id="responsavel"
                type="text"
                value={`${cliente.nome} (ID: ${cliente.id})`}
                disabled
                className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-500"
              />
              <input
                type="hidden"
                {...register("usuarioId", { valueAsNumber: true })}
              />
            </div>
          </div>

          {/* Coluna da foto */}
          <div className="md:col-span-2">
            <Rotulo>Foto do animal</Rotulo>

            {/* Os inputs ficam escondidos; os botões abaixo é que os acionam */}
            <input
              ref={inputArquivo}
              type="file"
              accept="image/*"
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
              onChange={(e) => {
                escolherFoto(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <input
              ref={inputCamera}
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
              onChange={(e) => {
                escolherFoto(e.target.files?.[0]);
                e.target.value = "";
              }}
            />

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setArrastando(true);
              }}
              onDragLeave={() => setArrastando(false)}
              onDrop={(e) => {
                e.preventDefault();
                setArrastando(false);
                escolherFoto(e.dataTransfer.files?.[0]);
              }}
              className={`flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed transition ${
                arrastando
                  ? "border-blue-700 bg-blue-50"
                  : erroFoto
                    ? "border-red-400 bg-red-50"
                    : "border-slate-300 bg-slate-50"
              }`}
            >
              {processandoFoto ? (
                <p className="px-6 text-center text-sm text-slate-500">
                  Preparando a foto...
                </p>
              ) : previa ? (
                <img
                  src={previa}
                  alt="Prévia da foto do animal"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="px-6 text-center">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.6}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mx-auto h-10 w-10 text-slate-400"
                    aria-hidden="true"
                  >
                    <path d="M4 8a2 2 0 012-2h1.5l1-1.5h7l1 1.5H18a2 2 0 012 2v9a2 2 0 01-2 2H6a2 2 0 01-2-2V8z" />
                    <circle cx="12" cy="12.5" r="3.5" />
                  </svg>
                  <p className="mt-3 text-sm text-slate-500">
                    <span className="hidden md:inline">
                      Arraste uma foto até aqui ou use o botão abaixo.
                    </span>
                    <span className="md:hidden">
                      Tire uma foto agora ou escolha uma da galeria.
                    </span>
                  </p>
                </div>
              )}
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
              <button
                type="button"
                onClick={() => inputArquivo.current?.click()}
                disabled={processandoFoto || carregando}
                className="cursor-pointer rounded-xl border border-blue-900 px-4 py-2.5 text-sm font-semibold text-blue-900 transition hover:bg-blue-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {foto ? "Trocar foto" : "Escolher foto"}
              </button>
              <button
                type="button"
                onClick={() => inputCamera.current?.click()}
                disabled={processandoFoto || carregando}
                className="cursor-pointer rounded-xl border border-blue-900 px-4 py-2.5 text-sm font-semibold text-blue-900 transition hover:bg-blue-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-60 md:hidden"
              >
                Tirar foto
              </button>
              {foto && (
                <button
                  type="button"
                  onClick={() => {
                    setFoto(null);
                    setErroFoto(null);
                  }}
                  disabled={carregando}
                  className="cursor-pointer rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Remover
                </button>
              )}
            </div>

            <Erro mensagem={erroFoto ?? undefined} />

            <p className="mt-3 text-xs text-slate-500">
              {foto
                ? `${foto.name} · ${tamanhoLegivel(foto.size)}. `
                : "JPG, PNG ou WebP. A foto é reduzida automaticamente. "}
              São permitidas apenas fotos de animais.
            </p>
          </div>

          {/* Rodapé do formulário */}
          <div className="md:col-span-5">
            <p className="mb-4 text-sm text-slate-500">
              <span className="text-red-500">*</span> Campos de preenchimento
              obrigatório.
            </p>

            <button
              type="submit"
              disabled={carregando}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-900 py-3.5 font-semibold text-white shadow-lg shadow-blue-900/20 transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {carregando && (
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    opacity="0.25"
                  />
                  <path
                    d="M22 12a10 10 0 0 1-10 10"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>
              )}
              {carregando ? "Cadastrando..." : "Cadastrar animal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}