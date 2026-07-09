import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAdminStore } from "./context/AdminContext";

export default function AdminLayout() {
  const { deslogaAdmin } = useAdminStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    deslogaAdmin();
    navigate("/login-admin");
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-100 md:flex-row">
      <aside className="border-b border-slate-200 bg-slate-950 text-white md:sticky md:top-0 md:h-screen md:w-72 md:border-b-0 md:border-r md:border-slate-800">
        <div className="flex h-full flex-col gap-6 px-4 py-5 sm:px-6 md:px-5 md:py-6">
          <div className="rounded-3xl bg-white/5 p-4 ring-1 ring-white/10 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-lg shadow-blue-950/30">
                <img
                  src="/img/logo_petpel.png"
                  alt="Logo Petpel"
                  className="h-8 w-8 object-contain"
                />
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-cyan-300">
                  Admin
                </p>
                <h2 className="text-lg font-black leading-tight text-white sm:text-xl">
                  Painel Petpel
                </h2>
              </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-300">
              Navegação rápida do administrador com acesso ao resumo, listagem e
              mensagens.
            </p>
          </div>

          <nav className="grid gap-2 md:block md:space-y-2">
            <NavLink
              to="/admin"
              end
              className={({ isActive }) =>
                [
                  "flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition",
                  isActive
                    ? "bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20"
                    : "text-slate-200 hover:bg-white/8 hover:text-white",
                ].join(" ")
              }
            >
              <span>Início</span>
              <span className="text-xs uppercase tracking-[0.25em] opacity-70">
                dashboard
              </span>
            </NavLink>

            <NavLink
              to="/admin/listagem"
              className={({ isActive }) =>
                [
                  "flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition",
                  isActive
                    ? "bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20"
                    : "text-slate-200 hover:bg-white/8 hover:text-white",
                ].join(" ")
              }
            >
              <span>Listagem</span>
              <span className="text-xs uppercase tracking-[0.25em] opacity-70">
                animais
              </span>
            </NavLink>

            <NavLink
              to="/admin/contato"
              className={({ isActive }) =>
                [
                  "flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition",
                  isActive
                    ? "bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20"
                    : "text-slate-200 hover:bg-white/8 hover:text-white",
                ].join(" ")
              }
            >
              <span>Mensagens</span>
              <span className="text-xs uppercase tracking-[0.25em] opacity-70">
                inbox
              </span>
            </NavLink>
          </nav>

          <div className="mt-auto rounded-3xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
              Sessão
            </p>
            <button
              onClick={handleLogout}
              className="mt-3 flex w-full items-center justify-center rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:border-red-500 hover:bg-red-600 hover:text-white"
            >
              Sair
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-slate-100 p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
