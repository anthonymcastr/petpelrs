export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* SOBRE */}
        <div>
          <h3 className="text-lg font-bold text-white mb-3">Sobre</h3>
          <p className="text-sm leading-relaxed">
            O PetPel RS é uma plataforma desenvolvida por Anthony Martins de
            Castro e Christiano Ferraz, estudantes do 5º semestre de ADS no UNISENAC RS, com o
            objetivo de ajudar na busca por pets perdidos, promover adoções
            responsáveis e conectar pessoas que se preocupam com o bem-estar
            animal.
          </p>
        </div>

        {/* SIGA-NOS */}
        <div>
          <h3 className="text-lg font-bold text-white mb-3">Siga-nos</h3>
          <div className="flex gap-4">
            <a
              href="https://www.instagram.com/anthonymcastr/"
              className="hover:scale-110 transition"
            >
              <img src="/img/insta-logo.png" alt="Instagram" className="h-8" />
            </a>
            <a
              href="https://web.facebook.com/anthony.castro.245117"
              className="hover:scale-110 transition"
            >
              <img src="/img/face-logo.png" alt="Facebook" className="h-8" />
            </a>
            <a
              href="https://www.linkedin.com/in/anthony-martins-de-castro/"
              className="hover:scale-110 transition"
            >
              <img
                src="/img/linkedin-logo.png"
                alt="LinkedIn"
                className="h-8"
              />
            </a>
          </div>
        </div>

        {/* CONTATO */}
        <div>
          <h3 className="text-lg font-bold text-white mb-3">Contato</h3>

          <p className="text-sm mb-2">
            📧 <strong>Email:</strong> anthonymartins19977@gmail.com
          </p>

          <p className="text-sm">
            📱 <strong>(53) 99170-6490</strong>
          </p>
        </div>
      </div>

      <div className="border-t border-gray-700 text-center py-4 text-xs text-gray-400">
        © {new Date().getFullYear()} PetPel RS — Todos os direitos reservados
      </div>
    </footer>
  );
}
