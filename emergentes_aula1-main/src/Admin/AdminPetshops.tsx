import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAdminStore } from "./context/AdminContext";

type Servico = { id: number; nome: string; descricao?: string | null; preco?: number | null; ativo: boolean };
type Petshop = { id: number; nome: string; descricao?: string | null; logoUrl?: string | null; endereco?: string | null; horario?: string | null; whatsapp: string; email?: string | null; ativo: boolean; servicos: Servico[] };
type FormPetshop = Omit<Petshop, "id" | "ativo" | "servicos"> & { senha?: string; confirmarSenha?: string };

const dias = ["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado", "Domingo"];

const vazio: FormPetshop = { nome: "", descricao: "", logoUrl: "", endereco: "", horario: "", whatsapp: "", email: "", senha: "", confirmarSenha: "" };

export default function AdminPetshops() {
  const { admin } = useAdminStore();
  const [petshops, setPetshops] = useState<Petshop[]>([]);
  const [form, setForm] = useState<FormPetshop>(vazio);
  const [editando, setEditando] = useState<number | null>(null);
  const [servicoPetshop, setServicoPetshop] = useState<number | null>(null);
  const [servico, setServico] = useState({ nome: "", descricao: "", preco: "" });
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);
  const [diasSelecionados, setDiasSelecionados] = useState<string[]>(dias.slice(0, 5));
  const [abertura, setAbertura] = useState("08:00");
  const [fechamento, setFechamento] = useState("18:00");
  const apiUrl = import.meta.env.VITE_API_URL;

  async function carregar() {
    const res = await fetch(`${apiUrl}/petshops/admin`, { headers: { Authorization: `Bearer ${admin?.token}` } });
    if (res.ok) setPetshops(await res.json());
    else toast.error("Não foi possível carregar as petshops");
  }

  useEffect(() => { if (admin?.token) carregar(); }, [admin?.token]);

  async function salvarPetshop(event: React.FormEvent) {
    event.preventDefault();
    const endpoint = editando ? `${apiUrl}/petshops/admin/${editando}` : `${apiUrl}/petshops/admin`;
    if (diasSelecionados.length === 0) { toast.error("Selecione ao menos um dia de funcionamento"); return; }
    if (!editando && form.senha.length < 8) { toast.error("A senha deve ter pelo menos 8 caracteres"); return; }
    if (form.senha !== form.confirmarSenha) { toast.error("As senhas não conferem"); return; }
    const res = await fetch(endpoint, { method: editando ? "PUT" : "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${admin?.token}` }, body: JSON.stringify({ ...form, diasFuncionamento: diasSelecionados.join(", "), horario: `${abertura} às ${fechamento}`, logoUrl: form.logoUrl || null, email: form.email || null, senha: form.senha || undefined, confirmarSenha: form.confirmarSenha || undefined }) });
    const dados = await res.json();
    if (!res.ok) { toast.error(dados.erro || "Erro ao salvar petshop"); return; }
    toast.success(editando ? "Petshop atualizada" : "Petshop cadastrada");
    setForm(vazio); setDiasSelecionados(dias.slice(0, 5)); setAbertura("08:00"); setFechamento("18:00"); setEditando(null); carregar();
  }

  async function alternarPetshop(petshop: Petshop) {
    await fetch(`${apiUrl}/petshops/admin/${petshop.id}/status`, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${admin?.token}` }, body: JSON.stringify({ ativo: !petshop.ativo }) });
    carregar();
  }

  async function salvarServico(event: React.FormEvent) {
    event.preventDefault();
    if (!servicoPetshop) return;
    const res = await fetch(`${apiUrl}/petshops/admin/${servicoPetshop}/servicos`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${admin?.token}` }, body: JSON.stringify({ nome: servico.nome, descricao: servico.descricao || null, preco: servico.preco === "" ? null : Number(servico.preco) }) });
    const dados = await res.json();
    if (!res.ok) { toast.error(dados.erro || "Erro ao cadastrar serviço"); return; }
    toast.success("Serviço cadastrado"); setServico({ nome: "", descricao: "", preco: "" }); carregar();
  }

  async function alternarServico(servico: Servico) {
    await fetch(`${apiUrl}/petshops/admin/servicos/${servico.id}/status`, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${admin?.token}` }, body: JSON.stringify({ ativo: !servico.ativo }) });
    carregar();
  }

  const campo = "w-full rounded-xl border border-slate-300 px-3 py-2 text-sm";

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-700">Parceiros</p>
        <h1 className="mt-2 text-3xl font-black text-slate-900">Petshops e serviços</h1>
        <p className="mt-2 text-slate-600">Cadastre a imagem do card, os dados de contato e o catálogo de serviços.</p>
      </header>

      <form onSubmit={salvarPetshop} className="grid gap-3 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 md:grid-cols-2">
        <h2 className="md:col-span-2 text-xl font-bold">{editando ? "Editar petshop" : "Cadastrar petshop"}</h2>
        {(["nome", "logoUrl", "whatsapp", "email", "endereco"] as const).map((campoForm) => (
          <input key={campoForm} className={campo} placeholder={campoForm === "logoUrl" ? "URL da foto/logo" : campoForm} value={form[campoForm] || ""} onChange={(e) => setForm({ ...form, [campoForm]: e.target.value })} required={campoForm === "nome" || campoForm === "whatsapp" || campoForm === "email"} />
        ))}
        <div className="grid gap-3 sm:grid-cols-2"><div className="relative"><input className={`${campo} pr-12`} type={mostrarSenha ? "text" : "password"} placeholder={editando ? "Nova senha (opcional)" : "Senha (mínimo 8 caracteres)"} value={form.senha || ""} onChange={(e) => setForm({ ...form, senha: e.target.value })} required={!editando} minLength={8} /><button type="button" onClick={() => setMostrarSenha(!mostrarSenha)} className="absolute right-2 top-2 rounded-lg px-2 py-1 text-xs font-semibold text-slate-500">{mostrarSenha ? "Ocultar" : "Mostrar"}</button></div><div className="relative"><input className={`${campo} pr-12`} type={mostrarConfirmacao ? "text" : "password"} placeholder="Confirmar senha" value={form.confirmarSenha || ""} onChange={(e) => setForm({ ...form, confirmarSenha: e.target.value })} required={!editando} minLength={8} /><button type="button" onClick={() => setMostrarConfirmacao(!mostrarConfirmacao)} className="absolute right-2 top-2 rounded-lg px-2 py-1 text-xs font-semibold text-slate-500">{mostrarConfirmacao ? "Ocultar" : "Mostrar"}</button></div></div>
        <textarea className={`${campo} md:col-span-2`} placeholder="Descrição" value={form.descricao || ""} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
        <fieldset className="md:col-span-2"><legend className="mb-2 text-sm font-semibold">Dias de funcionamento <b className="text-red-600">*</b></legend><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{dias.map((dia) => <label key={dia} className="flex items-center gap-2 rounded-xl border p-2 text-sm"><input type="checkbox" checked={diasSelecionados.includes(dia)} onChange={() => setDiasSelecionados((atual) => atual.includes(dia) ? atual.filter((item) => item !== dia) : [...atual, dia])} className="accent-blue-900" />{dia}</label>)}</div></fieldset>
        <div className="grid gap-3 md:col-span-2 sm:grid-cols-2"><label className="text-sm text-slate-600">Abertura<input className={`${campo} mt-1`} type="time" value={abertura} onChange={(e) => setAbertura(e.target.value)} required /></label><label className="text-sm text-slate-600">Fechamento<input className={`${campo} mt-1`} type="time" value={fechamento} onChange={(e) => setFechamento(e.target.value)} required /></label></div>
        <div className="flex gap-2 md:col-span-2">
          <button className="rounded-xl bg-blue-900 px-5 py-2.5 font-semibold text-white">{editando ? "Salvar edição" : "Cadastrar petshop"}</button>
          {editando && <button type="button" onClick={() => { setEditando(null); setForm(vazio); }} className="rounded-xl border px-5 py-2.5 font-semibold">Cancelar</button>}
        </div>
      </form>

      <div className="grid gap-5">
        {petshops.map((petshop) => (
          <article key={petshop.id} className="grid gap-5 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 md:grid-cols-[180px_1fr]">
            {petshop.logoUrl ? <img src={petshop.logoUrl} alt={petshop.nome} className="h-40 w-full rounded-2xl object-cover" /> : <div className="flex h-40 items-center justify-center rounded-2xl bg-blue-900 text-5xl font-black text-white">{petshop.nome[0]}</div>}
            <div>
              <div className="flex flex-wrap justify-between gap-2"><h2 className="text-xl font-bold">{petshop.nome}</h2><span className={petshop.ativo ? "text-emerald-600" : "text-slate-400"}>{petshop.ativo ? "Ativa" : "Inativa"}</span></div>
              <p className="mt-1 text-sm text-slate-500">{petshop.email || "Sem e-mail"} · WhatsApp: {petshop.whatsapp}</p>
              <div className="mt-4 flex flex-wrap gap-2"><button onClick={() => { setEditando(petshop.id); setForm({ nome: petshop.nome, descricao: petshop.descricao || "", logoUrl: petshop.logoUrl || "", endereco: petshop.endereco || "", horario: petshop.horario || "", diasFuncionamento: petshop.diasFuncionamento || "", whatsapp: petshop.whatsapp, email: petshop.email || "", senha: "", confirmarSenha: "" }); setDiasSelecionados(petshop.diasFuncionamento?.split(", ") || dias.slice(0, 5)); const [inicio, fim] = (petshop.horario || "08:00 às 18:00").split(" às "); setAbertura(inicio || "08:00"); setFechamento(fim || "18:00"); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="rounded-xl border px-3 py-2 text-sm font-semibold">Editar</button><button onClick={() => alternarPetshop(petshop)} className="rounded-xl border px-3 py-2 text-sm font-semibold">{petshop.ativo ? "Desativar" : "Ativar"}</button><button onClick={() => setServicoPetshop(servicoPetshop === petshop.id ? null : petshop.id)} className="rounded-xl bg-blue-900 px-3 py-2 text-sm font-semibold text-white">Novo serviço</button></div>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">{petshop.servicos.map((item) => <li key={item.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm"><span>{item.nome} {item.preco != null && `· R$ ${item.preco.toFixed(2)}`}</span><button onClick={() => alternarServico(item)} className="text-xs font-semibold text-blue-700">{item.ativo ? "Desativar" : "Ativar"}</button></li>)}</ul>
              {servicoPetshop === petshop.id && <form onSubmit={salvarServico} className="mt-4 grid gap-2 rounded-2xl border border-blue-100 bg-blue-50 p-4 sm:grid-cols-3"><input className={campo} placeholder="Nome do serviço" value={servico.nome} onChange={(e) => setServico({ ...servico, nome: e.target.value })} required /><input className={campo} placeholder="Descrição" value={servico.descricao} onChange={(e) => setServico({ ...servico, descricao: e.target.value })} /><input className={campo} type="number" min="0" step="0.01" placeholder="Preço" value={servico.preco} onChange={(e) => setServico({ ...servico, preco: e.target.value })} /><button className="rounded-xl bg-emerald-600 px-3 py-2 font-semibold text-white sm:col-span-3">Cadastrar serviço</button></form>}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
