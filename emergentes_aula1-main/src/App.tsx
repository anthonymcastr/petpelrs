import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Toaster } from "sonner";

// Alteração boba para redeploy

function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname]);

  return null;
}

export default function App() {
  return (
    <div
      className="
        min-h-screen
        bg-[url('/img/fundo-nuvem.png')]
        bg-cover
        bg-center
        bg-no-repeat
      "
    >
      <ScrollToTop />
      <Toaster richColors position="top-center" />
      <Outlet />
    </div>
  );
}
