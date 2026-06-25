import { useEffect, useState } from "react";
import type { Animal, AnimalComUsuario } from "../utils/animalType";
import { CardAnimal } from "../components/CardAnimal";
import { CardExpandido } from "../components/CardExpandido";
import { InputPesquisa } from "../components/InputPesquisa";
import { useAdminStore } from "../Admin/context/AdminContext";

export default function Listagem() {
  const [animais, setAnimais] = useState<Animal[]>([]);
  const [animaisOriginais, setAnimaisOriginais] = useState<Animal[]>([]);
  const [cardSelecionado, setCardSelecionado] =
    useState<AnimalComUsuario | null>(null);
  const [tipoAtivo, setTipoAtivo] = useState<string | null>(null);
  const [loadingDetalhe, setLoadingDetalhe] = useState(false);

  const { admin } = useAdminStore();
  const isAdmin = admin?.role === "admin";
  const apiUrl = import.meta.env.VITE_API_URL;

  // 🔹 Busca inicial de animais
  const buscaDados = async () => {
    try {
      const res = await fetch(`${apiUrl}/animais`);
      const dados: AnimalComUsuario[] = await res.json(); // agora sempre com usuario
      setAnimais(dados);
      setAnimaisOriginais(dados);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    buscaDados();
  }, []);

  // 🔹 Filtrar por tipo
  const filtrarPorTipo = (tipo: string) => {
    if (tipoAtivo === tipo) {
      setAnimais(animaisOriginais);
      setTipoAtivo(null);
      return;
    }
    const filtrados = animaisOriginais.filter((a) => a.tipo === tipo);
    setAnimais(filtrados);
    setTipoAtivo(tipo);
  };

  // 🔹 Ver detalhes do animal
  const handleVerDetalhes = async (animalId: number) => {
    try {
      setLoadingDetalhe(true);
      const res = await fetch(`${apiUrl}/animais/${animalId}`);
      if (!res.ok) throw new Error("Erro ao buscar animal");
      const animalCompleto: AnimalComUsuario = await res.json();
      setCardSelecionado(animalCompleto);
    } catch (err) {
      console.error(err);
      alert("Erro ao carregar dados do animal");
    } finally {
      setLoadingDetalhe(false);
    }
  };

  // 🔹 Remover animal da lista local
  const handleExcluido = (id: number) => {
    setAnimais((prev) => prev.filter((a) => a.id !== id));
    setAnimaisOriginais((prev) => prev.filter((a) => a.id !== id));
    if (cardSelecionado?.id === id) setCardSelecionado(null);
  };

  // 🔹 Exclusão admin
  const excluirAnimal = async (id: number) => {
    if (!confirm("Deseja realmente excluir este animal?")) return;

    try {
      const token = admin?.token;
      if (!token) return alert("Você precisa estar logado como administrador");

      const res = await fetch(`${apiUrl}/animais/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error("Erro ao excluir");

      alert("Animal excluído com sucesso!");
      handleExcluido(id);
    } catch (err) {
      console.error(err);
      alert("Erro ao excluir animal");
    }
  };

  return (
    <div className="min-h-screen">
      {/* Filtros */}
      <section className="max-w-7xl mx-auto px-4 pt-8">
        <InputPesquisa
          setAnimais={(dados) => {
            setAnimais(dados);
            setAnimaisOriginais(dados);
            setTipoAtivo(null);
          }}
        />
        <div className="flex justify-center gap-2 sm:gap-3 mt-6 flex-wrap">
          {[
            { tipo: "PERDIDO", label: "Perdidos", cor: "red" },
            { tipo: "ENCONTRADO", label: "Encontrados", cor: "green" },
            { tipo: "ADOCAO", label: "Para Adoção", cor: "blue" },
          ].map((btn) => (
            <button
              key={btn.tipo}
              onClick={() => filtrarPorTipo(btn.tipo)}
              className={`px-3 sm:px-4 py-2 rounded-full font-semibold text-sm sm:text-base cursor-pointer transition ${
                tipoAtivo === btn.tipo
                  ? `bg-${btn.cor}-600 text-white`
                  : `bg-${btn.cor}-500 text-white hover:bg-${btn.cor}-700`
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </section>

      {/* Título */}
      <section className="text-center mt-10 px-4">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900">
          Encontre seu{" "}
          <span className="underline underline-offset-4 decoration-blue-700">
            Pet
          </span>
        </h1>
        <p className="mt-2 text-gray-800">
          Animais perdidos, encontrados e para adoção em Pelotas
        </p>
      </section>

      {/* Grid ou detalhe */}
      <section className="flex justify-center px-4 mt-12 pb-16">
        {cardSelecionado ? (
          <CardExpandido
            animal={cardSelecionado}
            onClose={() => setCardSelecionado(null)}
            onExcluido={() =>
              cardSelecionado && handleExcluido(cardSelecionado.id)
            }
          />
        ) : (
          <div
            className="
              grid
              w-full
              max-w-7xl
              gap-6
              mx-auto
              pb-2
              [grid-template-columns:repeat(auto-fit,minmax(250px,320px))]
              justify-center
            "
          >
            {animais.length > 0 ? (
              animais.map((animal) => (
                <div key={animal.id} className="w-full max-w-[320px]">
                  <CardAnimal
                    data={animal}
                    onFazerContato={() => handleVerDetalhes(animal.id)}
                    isAdmin={isAdmin}
                    onExcluir={excluirAnimal}
                  />
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center w-full col-span-full">
                Nenhum animal encontrado
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
