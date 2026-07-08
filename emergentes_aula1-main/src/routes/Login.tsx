import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useClienteStore } from "../context/ClienteContext";
import { Link } from "react-router-dom";
import { useState } from "react";

type Inputs = {
  email: string;
  senha: string;
  manter: boolean;
};

const apiUrl = import.meta.env.VITE_API_URL;

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
      logaCliente(dados); //

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
    <section className="min-h-screen bg-[url('/img/fundo-nuvem.png')] bg-cover bg-center bg-no-repeat">
      <div className="flex flex-col items-center px-6 py-8 mx-auto md:h-screen lg:py-0">
        <div className="w-full bg-white rounded-lg shadow dark:border md:mt-20 sm:max-w-md xl:p-0 dark:bg-gray-800 dark:border-gray-700">
          <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
            <h1 className="text-xl font-bold leading-tight tracking-tight text-center text-gray-900 md:text-2xl dark:text-white">
              Faça login na sua conta
            </h1>
            <form
              className="space-y-4 md:space-y-6"
              onSubmit={handleSubmit(verificaLogin)}
            >
              <div>
                <label
                  htmlFor="email"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  Seu e-mail
                </label>
                <input
                  type="email"
                  id="email"
                  className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                  {...register("email")}
                />
              </div>
              <div>
                <label
                  htmlFor="password"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  Senha
                </label>
                <div className="relative">
                  <input
                    type={mostrarSenha ? "text" : "password"}
                    id="password"
                    className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg block w-full p-2.5 pr-12 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                    {...register("senha")}
                  />

                  <button
                    type="button"
                    onClick={() => setMostrarSenha((valor) => !valor)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                    aria-label={
                      mostrarSenha ? "Ocultar senha" : "Mostrar senha"
                    }
                  >
                    {mostrarSenha ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-5 h-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3.98 8.223A10.477 10.477 0 0112 4.5c4.135 0 7.863 2.123 10.02 5.723a.75.75 0 010 .554A10.477 10.477 0 0112 19.5c-4.135 0-7.863-2.123-10.02-5.723a.75.75 0 010-.554z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-5 h-5"
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
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="remember"
                      type="checkbox"
                      className="w-4 h-4 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
                      {...register("manter")}
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label
                      htmlFor="remember"
                      className="text-gray-500 dark:text-gray-300"
                    >
                      Manter Conectado
                    </label>
                  </div>
                </div>
              </div>
              <button
                type="submit"
                disabled={carregando}
                className="w-full text-white bg-blue-800 hover:cursor-pointer hover:bg-blue-900 font-medium rounded-lg py-2.5 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                {carregando ? "Entrando..." : "Entrar"}
              </button>
            </form>
          </div>
          <div className="mb-5">
            <p className="text-sm text-center text-gray-500 dark:text-gray-400">
              Não tem uma conta?{" "}
              <Link
                to="/cadastro"
                className="text-blue-800 hover:underline dark:text-blue-600"
              >
                Cadastre-se
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
