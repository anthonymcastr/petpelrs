import { Link, useNavigate, useLocation } from "react-router-dom";
import { useClienteStore } from "../context/ClienteContext";
import { useAdminStore } from "../Admin/context/AdminContext";
import { useState, useEffect } from "react";

export default function Titulo() {
  const { cliente, deslogaCliente } = useClienteStore();
  const { admin, deslogaAdmin } = useAdminStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuAberto, setMenuAberto] = useState(false);
  const [mensagensNaoLidas, setMensagensNaoLidas] = useState(0);

  const apiUrl = import.meta.env.VITE_API_URL;

  // Busca mensagens não lidas
  useEffect(() => {
    async function buscarNaoLidas() {
      if (!cliente?.id) return;

      try {
        const res = await fetch(`${apiUrl}/contatos/nao-lidas/${cliente.id}`);
        const data = await res.json();
        setMensagensNaoLidas(data.naoLidas || 0);
      } catch (err) {
        console.error("Erro ao buscar mensagens não lidas:", err);
      }
    }

    buscarNaoLidas();
    // Atualiza a cada 30 segundos
    const interval = setInterval(buscarNaoLidas, 30000);
    window.addEventListener("mensagens-lidas", buscarNaoLidas);
    return () => {
      clearInterval(interval);
      window.removeEventListener("mensagens-lidas", buscarNaoLidas);
    };
  }, [cliente?.id, apiUrl]);

  function handleLogout() {
    deslogaCliente();
    deslogaAdmin();
    navigate("/login");
  }

  function handleHomeClick() {
    // Se já está na home, força reload para limpar filtros
    if (location.pathname === "/") {
      window.location.reload();
    }
  }

  const fecharMenu = () => setMenuAberto(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-blue-900/95 shadow-lg backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-2 md:px-8">
        {/* Logo */}
        <Link
          to="/"
          onClick={handleHomeClick}
          className="flex items-center"
        >
          <img
            src="/img/logo-novo-white.png"
            alt="Logo Petpel"
            className="h-14 transition-transform hover:scale-105 md:h-16"
          />
        </Link>

        {/* Hamburger */}
        <button
          type="button"
          onClick={() => setMenuAberto(!menuAberto)}
          aria-label={menuAberto ? "Fechar menu" : "Abrir menu"}
          aria-expanded={menuAberto}
          className="cursor-pointer rounded-lg p-2 text-white transition hover:bg-white/10 focus:outline-none md:hidden"
        >
          <svg
            className="h-7 w-7"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d={menuAberto ? "M6 6l12 12M18 6L6 18" : "M4 6h16M4 12h16M4 18h16"}
            />
          </svg>
        </button>

        {/* Menu */}
        <div
          className={`
            ${menuAberto ? "block animate-fade-in" : "hidden"}
            absolute left-0 top-full w-full border-t border-white/10 bg-blue-900 shadow-xl
            md:static md:flex md:w-auto md:items-center md:border-0 md:bg-transparent md:shadow-none
          `}
        >
          <ul className="flex flex-col gap-1 px-4 py-4 font-medium text-white md:flex-row md:items-center md:gap-2 md:p-0">
            <NavItem
              to="/"
              label="Home"
              ativo={location.pathname === "/"}
              onClick={() => {
                handleHomeClick();
                fecharMenu();
              }}
            />

            <NavItem
              to="/parceiros"
              label="Parceiros"
              ativo={location.pathname.startsWith("/parceiros")}
              onClick={fecharMenu}
            />

            {!admin && !cliente && (
              <NavItem
                to="/login"
                label="Login"
                ativo={location.pathname === "/login"}
                onClick={fecharMenu}
              />
            )}

            {(cliente || admin) && (
              <>
                <NavItem
                  to="/inclusao"
                  label="Inclusão"
                  ativo={location.pathname === "/inclusao"}
                  onClick={fecharMenu}
                />

                <li>
                  <Link
                    to="/inbox"
                    onClick={fecharMenu}
                    className={`flex items-center gap-2 rounded-full px-4 py-2 transition hover:bg-white/10 ${
                      location.pathname === "/inbox"
                        ? "bg-white/15"
                        : ""
                    }`}
                  >
                    Minhas Mensagens
                    {mensagensNaoLidas > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
                        {mensagensNaoLidas > 99 ? "99+" : mensagensNaoLidas}
                      </span>
                    )}
                  </Link>
                </li>
              </>
            )}

            {(cliente || admin) && (
              <li className="flex items-center md:ml-2">
                <button
                  type="button"
                  onClick={() => {
                    handleLogout();
                    fecharMenu();
                  }}
                  className="w-full cursor-pointer rounded-full border border-white/30 px-5 py-2 font-medium transition hover:border-red-500 hover:bg-red-600 md:w-auto"
                >
                  Sair
                </button>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}

/* Item reutilizável */
function NavItem({
  to,
  label,
  ativo,
  onClick,
}: {
  to: string;
  label: string;
  ativo?: boolean;
  onClick?: () => void;
}) {
  return (
    <li>
      <Link
        to={to}
        onClick={onClick}
        aria-current={ativo ? "page" : undefined}
        className={`block rounded-full px-4 py-2 transition hover:bg-white/10 ${
          ativo ? "bg-white/15" : ""
        }`}
      >
        {label}
      </Link>
    </li>
  );
}