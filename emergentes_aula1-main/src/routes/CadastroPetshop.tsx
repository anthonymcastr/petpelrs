import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

const dias = [
  ["segunda", "Segunda-feira"],
  ["terca", "Terça-feira"],
  ["quarta", "Quarta-feira"],
  ["quinta", "Quinta-feira"],
  ["sexta", "Sexta-feira"],
  ["sabado", "Sábado"],
  ["domingo", "Domingo"],
] as const;

const campo = "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 transition focus:border-blue-700 focus:outline-2 focus:outline-offset-2 focus:outline-blue-200";

function Olho({ aberto }: { aberto: boolean }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className="h-5 w-5" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" /><circle cx="12" cy="12" r="2.5" />{aberto && <path strokeLinecap="round" d="m4 4 16 16" />}</svg>;
}

export default function CadastroPetshop() {
  const [form, setForm] = useState({ nome: "", email: "", whatsapp: "", logoUrl: "", endereco: "", descricao: "", abertura: "08:00", fechamento: "18:00", senha: "", confirmarSenha: "" });
  const [diasSelecionados, setDiasSelecionados] = useState<string[]>(["segunda", "terca", "quarta", "quinta", "sexta"]);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const navigate = useNavigate();

  function alterar(campoForm: string, valor: string) {
    setForm((atual) => ({ ...atual, [campoForm]: valor }));
  }

  function alternarDia(dia: string) {
    setDiasSelecionados((atual) => atual.includes(dia) ? atual.filter((item) => item !== dia) : [...atual, dia]);
  }

  async function enviar(event: React.FormEvent) {
    event.preventDefault();
    if (diasSelecionados.length === 0) return toast.error("Selecione ao menos um dia de funcionamento");
    if (form.senha.length < 8) return toast.error("A senha deve ter pelo menos 8 caracteres");
    if (form.senha !== form.confirmarSenha) return toast.error("As senhas não conferem");

    const nomesDias = dias.filter(([valor]) => diasSelecionados.includes(valor)).map(([, nome]) => nome);
    try {
      setEnviando(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/petshops/cadastro`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: form.nome,
          email: form.email,
          whatsapp: form.whatsapp,
          logoUrl: form.logoUrl || null,
          endereco: form.endereco || null,
          descricao: form.descricao || null,
          diasFuncionamento: nomesDias.join(", "),
          horario: `${form.abertura} às ${form.fechamento}`,
          senha: form.senha,
          confirmarSenha: form.confirmarSenha,
        }),
      });
      const dados = await res.json();
      if (!res.ok) throw new Error(dados.erro || "Não foi possível cadastrar a loja");
      toast.success("Loja cadastrada! Agora você já pode entrar como petshop.");
      navigate("/login-petshop");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao cadastrar loja");
    } finally {
      setEnviando(false);
    }
  }

  return <section className="relative min-h-screen overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-blue-700 px-4 py-8 sm:py-12"><div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-blue-400/20 blur-3xl" /><div className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-amber-300/10 blur-3xl" /><form onSubmit={enviar} className="relative mx-auto grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl md:grid-cols-[0.75fr_1.25fr]"><aside className="hidden flex-col justify-between bg-blue-900/95 p-8 text-white md:flex lg:p-10"><img src="/img/logo-novo-white.png" alt="PetPel RS" className="h-14 w-fit" /><div><p className="text-xs font-bold uppercase tracking-[0.3em] text-blue-200">Seja parceiro</p><h1 className="mt-3 text-3xl font-black leading-tight">Sua loja também pode ajudar a cuidar melhor dos pets.</h1><p className="mt-4 leading-7 text-blue-100">Cadastre seus serviços e receba pedidos de orçamento diretamente dos usuários.</p></div><Link to="/login" className="text-sm font-semibold text-blue-100 hover:text-white">Voltar para login</Link></aside><div className="p-6 sm:p-10"><div className="md:hidden"><Link to="/login" className="text-sm font-semibold text-blue-900">← Voltar para login</Link></div><h2 className="mt-5 text-2xl font-black tracking-tight text-slate-900 sm:mt-0 sm:text-3xl">Cadastrar loja parceira</h2><p className="mt-2 text-sm leading-6 text-slate-500">Preencha os dados da petshop. Os campos com <strong className="text-red-600">*</strong> são obrigatórios.</p><div className="mt-8 grid gap-5 sm:grid-cols-2"><label className="sm:col-span-2"><span className="mb-1.5 block text-sm font-semibold text-slate-700">Nome da petshop <b className="text-red-600">*</b></span><input className={campo} placeholder="Ex.: Pet Feliz Centro" value={form.nome} onChange={(e) => alterar("nome", e.target.value)} minLength={2} required /></label><label><span className="mb-1.5 block text-sm font-semibold text-slate-700">E-mail da loja <b className="text-red-600">*</b></span><input className={campo} type="email" placeholder="contato@petfeliz.com.br" value={form.email} onChange={(e) => alterar("email", e.target.value)} required /></label><label><span className="mb-1.5 block text-sm font-semibold text-slate-700">WhatsApp <b className="text-red-600">*</b></span><input className={campo} placeholder="(53) 99999-9999" value={form.whatsapp} onChange={(e) => alterar("whatsapp", e.target.value)} minLength={8} required /></label><label className="sm:col-span-2"><span className="mb-1.5 block text-sm font-semibold text-slate-700">Foto ou logo da loja</span><input className={campo} type="url" placeholder="https://exemplo.com/logo.jpg" value={form.logoUrl} onChange={(e) => alterar("logoUrl", e.target.value)} /></label><label className="sm:col-span-2"><span className="mb-1.5 block text-sm font-semibold text-slate-700">Endereço</span><input className={campo} placeholder="Rua, número, bairro e cidade" value={form.endereco} onChange={(e) => alterar("endereco", e.target.value)} /></label><label className="sm:col-span-2"><span className="mb-1.5 block text-sm font-semibold text-slate-700">Descrição da loja</span><textarea className={`${campo} resize-none`} rows={3} placeholder="Conte brevemente sobre a loja e os serviços oferecidos." value={form.descricao} onChange={(e) => alterar("descricao", e.target.value)} /></label><fieldset className="sm:col-span-2"><legend className="mb-2 text-sm font-semibold text-slate-700">Dias de funcionamento <b className="text-red-600">*</b></legend><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{dias.map(([valor, nome]) => <label key={valor} className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 p-3 text-sm text-slate-700 has-[:checked]:border-blue-700 has-[:checked]:bg-blue-50"><input type="checkbox" checked={diasSelecionados.includes(valor)} onChange={() => alternarDia(valor)} className="h-4 w-4 accent-blue-900" />{nome}</label>)}</div></fieldset><div className="sm:col-span-2"><p className="mb-2 text-sm font-semibold text-slate-700">Intervalo de atendimento <b className="text-red-600">*</b></p><div className="grid grid-cols-2 gap-3"><label className="text-xs text-slate-500">Abertura<input className={`${campo} mt-1`} type="time" value={form.abertura} onChange={(e) => alterar("abertura", e.target.value)} required /></label><label className="text-xs text-slate-500">Fechamento<input className={`${campo} mt-1`} type="time" value={form.fechamento} onChange={(e) => alterar("fechamento", e.target.value)} required /></label></div></div><label><span className="mb-1.5 block text-sm font-semibold text-slate-700">Senha <b className="text-red-600">*</b></span><div className="relative"><input className={`${campo} pr-12`} type={mostrarSenha ? "text" : "password"} placeholder="Mínimo de 8 caracteres" value={form.senha} onChange={(e) => alterar("senha", e.target.value)} minLength={8} required /><button type="button" onClick={() => setMostrarSenha(!mostrarSenha)} className="absolute right-2 top-2.5 rounded-lg p-1 text-slate-500" aria-label="Mostrar ou ocultar senha"><Olho aberto={mostrarSenha} /></button></div></label><label><span className="mb-1.5 block text-sm font-semibold text-slate-700">Confirmar senha <b className="text-red-600">*</b></span><div className="relative"><input className={`${campo} pr-12`} type={mostrarConfirmacao ? "text" : "password"} placeholder="Digite a senha novamente" value={form.confirmarSenha} onChange={(e) => alterar("confirmarSenha", e.target.value)} minLength={8} required /><button type="button" onClick={() => setMostrarConfirmacao(!mostrarConfirmacao)} className="absolute right-2 top-2.5 rounded-lg p-1 text-slate-500" aria-label="Mostrar ou ocultar confirmação"><Olho aberto={mostrarConfirmacao} /></button></div></label></div><button type="submit" disabled={enviando} className="mt-7 flex w-full items-center justify-center rounded-xl bg-blue-900 py-3 font-semibold text-white shadow-lg transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-70">{enviando ? "Cadastrando loja..." : "Cadastrar loja parceira"}</button></div></form></section>;
}
