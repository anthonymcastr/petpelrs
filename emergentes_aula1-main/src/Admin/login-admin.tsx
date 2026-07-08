import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAdminStore } from "./context/AdminContext"; // ⬅️ agora importa o contexto de admin

type Inputs = {
  email: string;
  senha: string;
};

const apiUrl = import.meta.env.VITE_API_URL;

export default function LoginAdmin() {
  const { register, handleSubmit } = useForm<Inputs>();
  const { logaAdmin } = useAdminStore(); // ⬅️ pega logaAdmin do contexto certo
  const navigate = useNavigate();
  const [carregando, setCarregando] = useState(false);

  function aguardar(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function verificaLogin(data: Inputs) {
    const inicio = Date.now();
    setCarregando(true);

    try {
      const response = await fetch(`${apiUrl}/login-admin`, {
        headers: { "Content-Type": "application/json" },
        method: "POST",
        body: JSON.stringify({ email: data.email, senha: data.senha }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.erro || "Login ou senha incorretos");
        return;
      }

      const dados = await response.json();
      console.log("Dados recebidos:", dados);

      if (dados.role !== "admin") {
        toast.error("Acesso restrito apenas para administradores");
        return;
      }

      const tempoDecorrido = Date.now() - inicio;
      if (tempoDecorrido < 1200) {
        await aguardar(1200 - tempoDecorrido);
      }

      logaAdmin(dados); //
      toast.success(`Bem-vindo, administrador ${dados.nome}!`);
      navigate("/admin");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao conectar com o servidor");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <section className="bg-cover min-h-screen">
      <div className="flex flex-col items-center px-6 py-4 mx-auto min-h-screen justify-center sm:justify-start sm:pt-8">
        <div className="w-full mt-3 bg-white rounded-lg shadow dark:border sm:max-w-md xl:p-0 dark:bg-gray-800 dark:border-gray-700">
          <div className="p-5 space-y-3 sm:p-6">
            <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white">
              Login de Administrador
            </h1>
            <div>
              <img
                className="w-40 sm:w-44 mx-auto"
                src="/img/gato_admin.png"
                alt="Gato com capacete de trabalhador"
              />
            </div>
            <form className="space-y-4" onSubmit={handleSubmit(verificaLogin)}>
              <div>
                <label
                  htmlFor="email"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  {...register("email")}
                  className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
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
                  required
                  {...register("senha")}
                  className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <button
                type="submit"
                disabled={carregando}
                className="w-full text-white bg-orange-600 hover:bg-orange-700 font-medium rounded-lg py-2.5 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                {carregando ? "Entrando..." : "Entrar como Admin"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
