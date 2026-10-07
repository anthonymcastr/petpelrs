export default function Footer() {
  const redes = [
    {
      nome: "Instagram",
      href: "https://www.instagram.com/anthonymcastr/",
      img: "/img/insta-logo.png",
    },
    {
      nome: "Facebook",
      href: "https://web.facebook.com/anthony.castro.245117",
      img: "/img/face-logo.png",
    },
    {
      nome: "LinkedIn",
      href: "https://www.linkedin.com/in/anthony-martins-de-castro/",
      img: "/img/linkedin-logo.png",
    },
  ];

  return (
    <footer className="mt-auto bg-gradient-to-b from-blue-950 to-slate-950 text-slate-300">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 py-12 md:grid-cols-3">
        {/* SOBRE */}
        <div>
          <h3 className="mb-3 text-xl font-bold text-white">PetPel RS</h3>
          <p className="text-sm leading-relaxed text-slate-400">
            Plataforma desenvolvida por Anthony Martins de Castro e Christiano
            Ferraz, estudantes do 5º semestre de ADS no UNISENAC RS, com o
            objetivo de ajudar na busca por pets perdidos, promover adoções
            responsáveis e conectar pessoas que se preocupam com o bem-estar
            animal.
          </p>
        </div>

        {/* SIGA-NOS */}
        <div>
          <h3 className="mb-3 text-lg font-semibold text-white">Siga-nos</h3>
          <div className="flex gap-3">
            {redes.map((rede) => (
              <a
                key={rede.nome}
                href={rede.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={rede.nome}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 transition hover:-translate-y-1 hover:bg-white/20"
              >
                <img src={rede.img} alt="" className="h-6 w-6 object-contain" />
              </a>
            ))}
          </div>
        </div>

        {/* CONTATO */}
        <div>
          <h3 className="mb-3 text-lg font-semibold text-white">Contato</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <a
                href="mailto:anthonymartins19977@gmail.com"
                className="transition hover:text-white"
              >
                anthonymartins19977@gmail.com
              </a>
            </li>
            <li>
              <a
                href="tel:+5553991706490"
                className="transition hover:text-white"
              >
                (53) 99170-6490
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 py-5 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} PetPel RS. Todos os direitos reservados.
      </div>
    </footer>
  );
}