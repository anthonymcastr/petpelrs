import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { usePetshopStore } from "../context/PetshopContext";

export default function LoginPetshop() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const { entrar } = usePetshopStore();
  const navigate = useNavigate();

  async function enviar(event: React.FormEvent) {
    event.preventDefault();
    try {
      setCarregando(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/login-petshop`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, senha }) });
      const dados = await res.json();
      if (!res.ok) throw new Error(dados.erro || "Não foi possível entrar");
      entrar(dados);
      navigate("/minha-loja");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Erro ao entrar"); }
    finally { setCarregando(false); }
  }

  return <main className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-4 py-10"><form onSubmit={enviar} className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl ring-1 ring-slate-200"><h1 className="text-2xl font-black text-slate-900">Entrar como petshop</h1><p className="mt-2 text-sm text-slate-500">Acesse os pedidos e o perfil da sua loja.</p><input className="mt-6 w-full rounded-xl border p-3" type="email" placeholder="E-mail da loja" value={email} onChange={(e) => setEmail(e.target.value)} required /><input className="mt-3 w-full rounded-xl border p-3" type="password" placeholder="Senha" value={senha} onChange={(e) => setSenha(e.target.value)} required /><button disabled={carregando} className="mt-5 w-full rounded-xl bg-blue-900 py-3 font-semibold text-white disabled:opacity-50">{carregando ? "Entrando..." : "Entrar"}</button></form></main>;
}
