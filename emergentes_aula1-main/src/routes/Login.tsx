import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { useClienteStore } from "../context/ClienteContext";
import { useState } from "react";

type Inputs = {
  email: string;
  senha: string;
  manter: boolean;
};

const apiUrl = import.meta.env.VITE_API_URL;

const campo =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 transition focus:border-blue-700 focus:outline-2 focus:outline-offset-0 focus:outline-blue-200";

export default function Login() {
  const { register, handleSubmit } = useForm<Inputs>();
  const { logaCliente } = useClienteStore();
  const navigate = useNavigate();
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);

  function aguardar(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function verificaLogin(data: Inputs) {
    const inicio = Date.now();
    setCarregando(true);

    try {
      const response = await fetch(`${apiUrl}/clientes/login`, {
        headers: { "Content-Type": "application/json" },
        method: "POST",
        body: JSON.stringify({ email: data.email, senha: data.senha }),
      });

      if (response.status !== 200) {
        toast.error("Erro... Login ou senha incorretos");
        return;
      }

      const dados = await response.json();
      logaCliente(dados);

      const tempoDecorrido = Date.now() - inicio;
      if (tempoDecorrido < 1200) {
        await aguardar(1200 - tempoDecorrido);
      }

      toast.success(`Bem-vindo, ${dados.nome}!`);
      navigate("/");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao conectar com o servidor");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <section className="relative flex min-h-[calc(100dvh-5rem)] items-center justify-center overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-blue-700 px-4 py-10">
      <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-blue-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-amber-300/10 blur-3xl" />

      <div className="relative grid w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl md:grid-cols-2">
        {/* Painel da marca (só em telas grandes) */}
        <div className="hidden flex-col justify-between bg-blue-900/95 p-10 text-white md:flex">
          <img
            src="/img/logo-novo-white.png"
            alt="PetPel RS"
            className="h-16 w-fit"
          />
          <div>
            <h2 className="text-3xl font-extrabold leading-tight tracking-tight">
              Todo pet merece voltar pra casa.
            </h2>
            <p className="mt-4 text-blue-100">
              Entre para cadastrar animais, conversar com os responsáveis e
              ajudar a reunir famílias em Pelotas.
            </p>
          </div>
          <p className="text-sm text-blue-200">PetPel RS</p>
        </div>

        {/* Formulário */}
        <div className="p-6 sm:p-10">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Entrar na sua conta
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Use o e-mail e a senha do seu cadastro.
          </p>

          <form
            className="mt-8 space-y-5"
            onSubmit={handleSubmit(verificaLogin)}
          >
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                E-mail
              </label>
              <input
                type="email"
                id="email"
                autoComplete="email"
                placeholder="voce@email.com"
                className={campo}
                required
                {...register("email")}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Senha
              </label>
              <div className="relative">
                <input
                  type={mostrarSenha ? "text" : "password"}
                  id="password"
                  autoComplete="current-password"
                  placeholder="Sua senha"
                  className={`${campo} pr-12`}
                  required
                  {...register("senha")}
                />

                <button
                  type="button"
                  onClick={() => setMostrarSenha((valor) => !valor)}
                  className="absolute inset-y-0 right-2 my-auto flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                  aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
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
                    {mostrarSenha && (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 4l16 16"
                      />
                    )}
                  </svg>
                </button>
              </div>
            </div>

            <label
              htmlFor="remember"
              className="flex w-fit cursor-pointer items-center gap-3 text-sm text-slate-600"
            >
              <input
                id="remember"
                type="checkbox"
                className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-blue-900"
                {...register("manter")}
              />
              Manter conectado
            </label>

            <button
              type="submit"
              disabled={carregando}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-900 py-3 font-semibold text-white shadow-lg shadow-blue-900/20 transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-70"
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
              {carregando ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            Ainda não tem conta?{" "}
            <Link
              to="/cadastro"
              className="font-semibold text-blue-900 hover:underline"
            >
              Cadastre-se
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}