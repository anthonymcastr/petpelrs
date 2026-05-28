import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useState } from "react";

type Inputs = {
  nome: string;
  email: string;
  senha: string;
  telefone: string;
  cpf: string;
};

const apiUrl = import.meta.env.VITE_API_URL;

// Componente de checklist da senha
function SenhaChecklist({ senha }: { senha: string }) {
  const requisitos = [
    { label: "Mínimo 8 caracteres", valido: senha.length >= 8 },
    { label: "Letra maiúscula (A-Z)", valido: /[A-Z]/.test(senha) },
    { label: "Letra minúscula (a-z)", valido: /[a-z]/.test(senha) },
    { label: "Número (0-9)", valido: /[0-9]/.test(senha) },
    {
      label: "Caractere especial (!@#$%)",
      valido: /[!@#$%^&*(),.?":{}|<>]/.test(senha),
    },
  ];

  return (
    <div className="mt-2 space-y-1">
      {requisitos.map((req, index) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <span
            className={`flex items-center justify-center w-4 h-4 rounded-full transition-colors ${
              req.valido ? "bg-green-500" : "bg-gray-300"
            }`}
          >
            {req.valido && (
              <svg
                className="w-3 h-3 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </span>
          <span
            className={`transition-colors ${
              req.valido ? "text-green-600" : "text-gray-500"
            }`}
          >
            {req.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function Cadastro() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, touchedFields, dirtyFields },
  } = useForm<Inputs>({ mode: "onBlur" });
  const navigate = useNavigate();
  const [senhaFocada, setSenhaFocada] = useState(false);

  const senha = watch("senha", "");
  const nome = watch("nome", "");
  const email = watch("email", "");
  const telefone = watch("telefone", "");
  const cpf = watch("cpf", "");

  // Validação simples de CPF (formato e dígitos)
  function validaCPF(cpf: string) {
    cpf = cpf.replace(/\D/g, "");
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
    let soma = 0,
      resto;
    for (let i = 1; i <= 9; i++)
      soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.substring(9, 10))) return false;
    soma = 0;
    for (let i = 1; i <= 10; i++)
      soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.substring(10, 11))) return false;
    return true;
  }

  // Função para determinar a classe da borda do input
  const getInputClass = (fieldName: keyof Inputs, isValid: boolean) => {
    const baseClass =
      "bg-gray-50 text-gray-900 sm:text-sm rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 transition-colors";
    const touched = touchedFields[fieldName] || dirtyFields[fieldName];

    if (!touched) {
      return `${baseClass} border border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500`;
    }
    if (isValid) {
      return `${baseClass} border-2 border-green-500 focus:ring-green-500 focus:border-green-500`;
    }
    return `${baseClass} border-2 border-red-500 focus:ring-red-500 focus:border-red-500`;
  };

  // Validações individuais
  const nomeValido = nome.length >= 10;
  const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const telefoneValido = telefone.length >= 8;
  const cpfValido = validaCPF(cpf);

  // Valida se a senha atende todos os requisitos
  const senhaValida =
    senha.length >= 8 &&
    /[A-Z]/.test(senha) &&
    /[a-z]/.test(senha) &&
    /[0-9]/.test(senha) &&
    /[!@#$%^&*(),.?":{}|<>]/.test(senha);

  const onSubmit = async (data: Inputs) => {
    if (!senhaValida) {
      toast.error("A senha não atende todos os requisitos");
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/clientes/cadastro`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.status === 201) {
        toast.success(
          "Cadastro realizado com sucesso! Redirecionando para o login...",
          {
            duration: 5000,
          }
        );
        setTimeout(() => {
          navigate("/login");
        }, 5000);
      } else {
        const erro = await response.json();
        toast.error(erro.error || "Erro no cadastro");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao conectar com o servidor");
    }
  };

  return (
    <section className="bg-gray-50 dark:bg-gray-900 min-h-screen flex items-center justify-center">
      <div className="w-full bg-white rounded-lg shadow dark:border md:max-w-md xl:p-0 my-5 dark:bg-gray-800 dark:border-gray-700">
        <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
          <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white">
            Criar Conta
          </h1>

          <form
            className="space-y-4 md:space-y-6"
            onSubmit={handleSubmit(onSubmit)}
          >
            <div>
              <label
                htmlFor="nome"
                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
              >
                Nome completo
              </label>
              <input
                type="text"
                id="nome"
                placeholder="Ex: João Silva Santos"
                {...register("nome", {
                  required: "Nome é obrigatório",
                  minLength: { value: 10, message: "Mínimo 10 caracteres" },
                })}
                className={getInputClass("nome", nomeValido)}
              />
              {errors.nome && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.nome.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="email"
                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
              >
                E-mail
              </label>
              <input
                type="email"
                id="email"
                placeholder="Ex: joao.silva@email.com"
                {...register("email", {
                  required: "E-mail é obrigatório",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Digite um e-mail válido",
                  },
                })}
                className={getInputClass("email", emailValido)}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="telefone"
                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
              >
                Telefone
              </label>
              <input
                type="tel"
                id="telefone"
                placeholder="Ex: (53) 99999-9999"
                {...register("telefone", {
                  required: "Telefone é obrigatório",
                  minLength: { value: 8, message: "Mínimo 8 dígitos" },
                })}
                className={getInputClass("telefone", telefoneValido)}
              />
              {errors.telefone && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.telefone.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="cpf"
                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
              >
                CPF
              </label>
              <input
                type="text"
                id="cpf"
                placeholder="Ex: 123.456.789-09"
                {...register("cpf", {
                  required: "CPF é obrigatório",
                  validate: (value) =>
                    validaCPF(value) || "Digite um CPF válido",
                })}
                className={getInputClass("cpf", cpfValido)}
                maxLength={14}
              />
              {errors.cpf && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.cpf.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="senha"
                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
              >
                Senha
              </label>
              <input
                type="password"
                id="senha"
                placeholder="Digite uma senha forte"
                {...register("senha", { required: "Senha é obrigatória" })}
                onFocus={() => setSenhaFocada(true)}
                className={getInputClass("senha", senhaValida)}
              />
              {errors.senha && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.senha.message}
                </p>
              )}

              {/* Checklist de requisitos da senha */}
              {(senhaFocada || senha.length > 0) && (
                <SenhaChecklist senha={senha} />
              )}
            </div>

            <button
              type="submit"
              disabled={!senhaValida}
              className={`w-full text-white font-medium rounded-lg py-2.5 transition ${
                senhaValida
                  ? "bg-blue-600 hover:bg-blue-700 cursor-pointer"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
            >
              Cadastrar
            </button>

            <p className="text-sm text-center text-gray-500 dark:text-gray-400">
              Já tem uma conta?{" "}
              <a
                href="/login"
                className="text-blue-600 hover:underline dark:text-blue-400"
              >
                Faça login!
              </a>
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
