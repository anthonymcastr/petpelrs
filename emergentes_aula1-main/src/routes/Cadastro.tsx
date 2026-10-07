import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { useState } from "react";

type Inputs = {
  nome: string;
  email: string;
  senha: string;
  confirmarSenha: string;
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
    <ul className="mt-3 space-y-1.5 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200/70">
      {requisitos.map((req) => (
        <li key={req.label} className="flex items-center gap-2 text-sm">
          <span
            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition-colors ${
              req.valido ? "bg-emerald-500" : "bg-slate-300"
            }`}
          >
            {req.valido && (
              <svg
                className="h-3 w-3 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
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
              req.valido ? "text-emerald-700" : "text-slate-500"
            }`}
          >
            {req.label}
          </span>
        </li>
      ))}
    </ul>
  );
}

// Botão de mostrar/ocultar senha
function BotaoOlho({
  visivel,
  onClick,
  rotulo,
}: {
  visivel: boolean;
  onClick: () => void;
  rotulo: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute inset-y-0 right-2 my-auto flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
      aria-label={visivel ? `Ocultar ${rotulo}` : `Mostrar ${rotulo}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.6}
        stroke="currentColor"
        className="h-5 w-5"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
        {visivel && (
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4l16 16" />
        )}
      </svg>
    </button>
  );
}

function Rotulo({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-sm font-medium text-slate-700"
    >
      {children} <span className="text-red-500">*</span>
    </label>
  );
}

function Erro({ mensagem }: { mensagem?: string }) {
  if (!mensagem) return null;
  return <p className="mt-1.5 text-sm text-red-600">{mensagem}</p>;
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
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmacaoSenha, setMostrarConfirmacaoSenha] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const senha = watch("senha", "");
  const confirmarSenha = watch("confirmarSenha", "");
  const nome = watch("nome", "");
  const email = watch("email", "");
  const telefone = watch("telefone", "");
  const cpf = watch("cpf", "");

  // Validação simples de CPF
  function validaCPF(cpf: string) {
    cpf = cpf.replace(/\D/g, "");

    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

    let soma = 0;
    let resto;

    for (let i = 1; i <= 9; i++) {
      soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    }

    resto = (soma * 10) % 11;

    if (resto === 10 || resto === 11) resto = 0;

    if (resto !== parseInt(cpf.substring(9, 10))) return false;

    soma = 0;

    for (let i = 1; i <= 10; i++) {
      soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    }

    resto = (soma * 10) % 11;

    if (resto === 10 || resto === 11) resto = 0;

    if (resto !== parseInt(cpf.substring(10, 11))) return false;

    return true;
  }

  // Classe dinâmica dos inputs (neutro, verde = válido, vermelho = inválido)
  const getInputClass = (fieldName: keyof Inputs, isValid: boolean) => {
    const baseClass =
      "w-full rounded-xl bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 transition focus:outline-2 focus:outline-offset-0";

    const touched = touchedFields[fieldName] || dirtyFields[fieldName];

    if (!touched) {
      return `${baseClass} border border-slate-300 focus:border-blue-700 focus:outline-blue-200`;
    }

    if (isValid) {
      return `${baseClass} border-2 border-emerald-500 focus:outline-emerald-200`;
    }

    return `${baseClass} border-2 border-red-500 focus:outline-red-200`;
  };

  // Validações
  const nomeValido = nome.length >= 10;

  const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const telefoneValido = telefone.length >= 8;

  const cpfValido = validaCPF(cpf);

  const senhaValida =
    senha.length >= 8 &&
    /[A-Z]/.test(senha) &&
    /[a-z]/.test(senha) &&
    /[0-9]/.test(senha) &&
    /[!@#$%^&*(),.?":{}|<>]/.test(senha);

  const confirmarSenhaValida =
    confirmarSenha.length > 0 && confirmarSenha === senha;

  const podeEnviar = senhaValida && confirmarSenhaValida && !enviando;

  const onSubmit = async (data: Inputs) => {
    if (!senhaValida) {
      toast.error("A senha não atende todos os requisitos");
      return;
    }

    if (data.senha !== data.confirmarSenha) {
      toast.error("As senhas não conferem");
      return;
    }

    const { confirmarSenha: _, ...payload } = data;

    setEnviando(true);

    try {
      const response = await fetch(`${apiUrl}/clientes/cadastro`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 201) {
        toast.success(
          "Cadastro realizado com sucesso! Redirecionando para o login...",
          {
            duration: 5000,
          },
        );

        setTimeout(() => {
          navigate("/login");
        }, 5000);
        // O botão fica bloqueado até o redirecionamento
        return;
      }

      const erro = await response.json();
      toast.error(erro.error || "Erro no cadastro");
      setEnviando(false);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao conectar com o servidor");
      setEnviando(false);
    }
  };

  return (
    <section className="relative flex min-h-[calc(100dvh-5rem)] items-center justify-center overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-blue-700 px-4 py-10">
      <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-blue-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-amber-300/10 blur-3xl" />

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl lg:grid-cols-5">
        {/* Painel da marca (só em telas grandes) */}
        <div className="hidden flex-col justify-between bg-blue-900/95 p-10 text-white lg:col-span-2 lg:flex">
          <img
            src="/img/logo-novo-white.png"
            alt="PetPel RS"
            className="h-16 w-fit"
          />
          <div>
            <h2 className="text-3xl font-extrabold leading-tight tracking-tight">
              Crie sua conta e ajude um pet a voltar pra casa.
            </h2>
            <p className="mt-4 text-blue-100">
              Com a conta você cadastra animais perdidos, encontrados ou para
              adoção e conversa direto com os responsáveis.
            </p>
          </div>
          <p className="text-sm text-blue-200">PetPel RS</p>
        </div>

        {/* Formulário */}
        <div className="p-6 sm:p-10 lg:col-span-3">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Criar conta
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Preencha seus dados para começar.
          </p>

          <form
            className="mt-8 grid gap-5 sm:grid-cols-2"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
          >
            {/* Nome */}
            <div className="sm:col-span-2">
              <Rotulo htmlFor="nome">Nome completo</Rotulo>

              <input
                type="text"
                id="nome"
                autoComplete="name"
                placeholder="Ex: João Silva Santos"
                {...register("nome", {
                  required: "Nome é obrigatório",
                  minLength: {
                    value: 10,
                    message: "Mínimo 10 caracteres",
                  },
                })}
                className={getInputClass("nome", nomeValido)}
              />

              <Erro mensagem={errors.nome?.message} />
            </div>

            {/* Email */}
            <div className="sm:col-span-2">
              <Rotulo htmlFor="email">E-mail</Rotulo>

              <input
                type="email"
                id="email"
                autoComplete="email"
                placeholder="Ex: joao@email.com"
                {...register("email", {
                  required: "E-mail é obrigatório",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Digite um e-mail válido",
                  },
                })}
                className={getInputClass("email", emailValido)}
              />

              <Erro mensagem={errors.email?.message} />
            </div>

            {/* Telefone */}
            <div>
              <Rotulo htmlFor="telefone">Telefone</Rotulo>

              <input
                type="tel"
                id="telefone"
                autoComplete="tel"
                placeholder="Ex: (53) 99999-9999"
                {...register("telefone", {
                  required: "Telefone é obrigatório",
                  minLength: {
                    value: 8,
                    message: "Mínimo 8 dígitos",
                  },
                })}
                className={getInputClass("telefone", telefoneValido)}
              />

              <Erro mensagem={errors.telefone?.message} />
            </div>

            {/* CPF */}
            <div>
              <Rotulo htmlFor="cpf">CPF</Rotulo>

              <input
                type="text"
                id="cpf"
                inputMode="numeric"
                placeholder="Ex: 123.456.789-09"
                {...register("cpf", {
                  required: "CPF é obrigatório",
                  validate: (value) =>
                    validaCPF(value) || "Digite um CPF válido",
                })}
                className={getInputClass("cpf", cpfValido)}
                maxLength={14}
              />

              <Erro mensagem={errors.cpf?.message} />
            </div>

            {/* Senha */}
            <div className="sm:self-start">
              <Rotulo htmlFor="senha">Senha</Rotulo>

              <div className="relative">
                <input
                  type={mostrarSenha ? "text" : "password"}
                  id="senha"
                  autoComplete="new-password"
                  placeholder="Digite uma senha forte"
                  {...register("senha", {
                    required: "Senha é obrigatória",
                  })}
                  onFocus={() => setSenhaFocada(true)}
                  className={`${getInputClass("senha", senhaValida)} pr-12`}
                />

                <BotaoOlho
                  visivel={mostrarSenha}
                  onClick={() => setMostrarSenha((valor) => !valor)}
                  rotulo="senha"
                />
              </div>

              <Erro mensagem={errors.senha?.message} />

              {(senhaFocada || senha.length > 0) && (
                <SenhaChecklist senha={senha} />
              )}
            </div>

            {/* Confirmação de senha */}
            <div className="sm:self-start">
              <Rotulo htmlFor="confirmarSenha">Confirmação de senha</Rotulo>

              <div className="relative">
                <input
                  type={mostrarConfirmacaoSenha ? "text" : "password"}
                  id="confirmarSenha"
                  autoComplete="new-password"
                  placeholder="Digite a senha novamente"
                  {...register("confirmarSenha", {
                    required: "Confirmação de senha é obrigatória",
                    validate: (value) =>
                      value === senha || "As senhas não conferem",
                  })}
                  className={`${getInputClass(
                    "confirmarSenha",
                    confirmarSenhaValida,
                  )} pr-12`}
                />

                <BotaoOlho
                  visivel={mostrarConfirmacaoSenha}
                  onClick={() => setMostrarConfirmacaoSenha((valor) => !valor)}
                  rotulo="confirmação de senha"
                />
              </div>

              <Erro mensagem={errors.confirmarSenha?.message} />
            </div>

            {/* Aviso + botão */}
            <div className="sm:col-span-2">
              <p className="mb-4 text-sm text-slate-500">
                <span className="text-red-500">*</span> Todos os campos são
                obrigatórios.
              </p>

              <button
                type="submit"
                disabled={!podeEnviar}
                className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 font-semibold text-white transition ${
                  podeEnviar
                    ? "cursor-pointer bg-blue-900 shadow-lg shadow-blue-900/20 hover:bg-blue-800"
                    : "cursor-not-allowed bg-slate-400"
                }`}
              >
                {enviando && (
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
                {enviando ? "Cadastrando..." : "Cadastrar"}
              </button>

              {!senhaValida || !confirmarSenhaValida ? (
                <p className="mt-2 text-center text-xs text-slate-500">
                  O botão libera quando a senha cumprir todos os requisitos e a
                  confirmação for igual.
                </p>
              ) : null}
            </div>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            Já tem uma conta?{" "}
            <Link
              to="/login"
              className="font-semibold text-blue-900 hover:underline"
            >
              Faça login
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}