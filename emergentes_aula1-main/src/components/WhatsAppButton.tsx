import { useLocation } from "react-router-dom";

// Telas em que o botão flutuante atrapalharia (barra de digitação do chat)
const ROTAS_SEM_BOTAO = ["/inbox", "/contato"];

export default function WhatsAppButton() {
  const { pathname } = useLocation();

  const escondido =
    ROTAS_SEM_BOTAO.some((rota) => pathname.includes(rota)) ||
    pathname.startsWith("/parceiros/");

  if (escondido) return null;

  return (
    <a
      href="https://wa.me/5553991706490?text=Ol%C3%A1!%20Vim%20do%20PetPel%20RS%20"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Fale conosco no WhatsApp"
      title="Fale conosco no WhatsApp"
      className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 shadow-lg shadow-green-900/30 transition duration-300 hover:scale-110 hover:bg-green-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700"
    >
      <img src="/img/logozap.png" alt="" className="h-8 w-8" />
    </a>
  );
}