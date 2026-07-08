import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import type { Animal } from "../utils/animalType";
import { useClienteStore } from "../context/ClienteContext";

export default function Inclusao() {
  const { cliente } = useClienteStore();
  const navigate = useNavigate();
  const [alerta, setAlerta] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

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

  function aguardar(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function onSubmit(data: Animal) {
    const inicio = Date.now();
    setCarregando(true);

    try {
      const resp = await fetch(`${API_URL}/animais`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        const msg =
          data.erro ||
          "Falha ao cadastrar animal. São permitidas apenas fotos de animais no nosso sistema. Agradecemos a compreensão.";
        setAlerta(msg);
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
      navigate("/"); // volta pra listagem (home)
    } catch (error) {
      console.error(error);
      setAlerta("Erro ao cadastrar animal");
    } finally {
      setCarregando(false);
    }
  }

  if (!cliente) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg font-semibold">
          Você precisa estar logado para cadastrar um animal.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      {alerta && (
        <div className="max-w-xl mx-auto mb-6">
          <div className="flex items-center gap-3 bg-red-100 border border-red-300 text-red-800 rounded-xl px-5 py-4 shadow-lg animate-fade-in">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-7 h-7 flex-shrink-0"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2.25m0 3.75h.01m-6.938 4.5a9 9 0 1113.856 0H5.062z"
              />
            </svg>
            <span className="font-semibold text-base">{alerta}</span>
            <button
              onClick={() => setAlerta(null)}
              className="ml-auto text-red-500 hover:text-red-700 transition text-lg"
            >
              ×
            </button>
          </div>
        </div>
      )}
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-extrabold text-center mb-8 text-gray-800">
          Cadastro de Animal 🐾
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6">
          {/* Nome */}
          <div>
            <label className="block mb-1 font-semibold">
              Nome do animal <span className="text-red-500">*</span>
            </label>
            <input
              {...register("nome", { required: "Nome obrigatório" })}
              className="w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Thor"
            />
            {errors.nome && (
              <p className="text-red-500 text-sm mt-1">{errors.nome.message}</p>
            )}
          </div>

          {/* Idade */}
          <div>
            <label className="block mb-1 font-semibold">
              Idade <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              {...register("idade", {
                required: "Idade obrigatória",
                valueAsNumber: true,
              })}
              className="w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-blue-500"
            />
            {errors.idade && (
              <p className="text-red-500 text-sm mt-1">
                {errors.idade.message}
              </p>
            )}
          </div>

          
          <div>
            <label className="block mb-1 font-semibold">
              Raça <span className="text-red-500">*</span>
            </label>
            <input
              {...register("raca", { required: "Raça obrigatória" })}
              className="w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Labrador"
            />
            {errors.raca && (
              <p className="text-red-500 text-sm mt-1">{errors.raca.message}</p>
            )}
          </div>

          {/* Tipo */}
          <div>
            <label className="block mb-1 font-semibold">
              Tipo <span className="text-red-500">*</span>
            </label>
            <select
              {...register("tipo", { required: "Tipo obrigatório" })}
              className="w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione</option>
              <option value="ADOCAO">Adoção</option>
              <option value="PERDIDO">Perdido</option>
              <option value="ENCONTRADO">Encontrado</option>
            </select>
            {errors.tipo && (
              <p className="text-red-500 text-sm mt-1">{errors.tipo.message}</p>
            )}
          </div>

          {/* Cidade */}
          <div>
            <label className="block mb-1 font-semibold">
              Cidade <span className="text-red-500">*</span>
            </label>
            <select
              {...register("cidade", { required: "Cidade obrigatória" })}
              className="w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione</option>
              <option value="PELOTAS">Pelotas</option>
            </select>
            {errors.cidade && (
              <p className="text-red-500 text-sm mt-1">
                {errors.cidade.message}
              </p>
            )}
          </div>

          {/* Imagem */}
          <div>
            <label className="block mb-1 font-semibold">
              URL da imagem <span className="text-red-500">*</span>
            </label>
            <input
              {...register("urlImagem", {
                required: "URL obrigatória",
                pattern: {
                  value: /^https?:\/\//,
                  message: "URL inválida",
                },
              })}
              className="w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-blue-500"
              placeholder="https://..."
            />
            {errors.urlImagem && (
              <p className="text-red-500 text-sm mt-1">
                {errors.urlImagem.message}
              </p>
            )}
          </div>

          {/* Usuário (bloqueado) */}
          <div>
            <label className="block mb-1 font-semibold">
              Usuário responsável
            </label>
            <input
              type="text"
              value={`${cliente.nome} (ID: ${cliente.id})`}
              disabled
              className="w-full rounded-lg border bg-gray-100 px-4 py-2 text-gray-600 cursor-not-allowed"
            />
            <input
              type="hidden"
              {...register("usuarioId", { valueAsNumber: true })}
            />
          </div>

          <p className="text-sm text-gray-500">
            <span className="text-red-500">*</span> Todos os campos com esse
            símbolo são de preenchimento obrigatório.
          </p>

          {/* Botão */}
          <button
            type="submit"
            disabled={carregando}
            className="mt-4 w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {carregando && (
              <svg
                className="w-4 h-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
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
            {carregando ? "Cadastrando..." : "Cadastrar Animal"}
          </button>
        </form>
      </div>
    </div>
  );
}
