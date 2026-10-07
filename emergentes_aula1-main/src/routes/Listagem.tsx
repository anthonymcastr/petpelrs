import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import type { Animal, AnimalComUsuario } from "../utils/animalType";
import { CardAnimal } from "../components/CardAnimal";
import { CardExpandido } from "../components/CardExpandido";
import { ConfirmacaoExclusao } from "../components/ConfirmacaoExclusao";
import { InputPesquisa } from "../components/InputPesquisa";
import { Carrossel } from "../components/Carrossel";
import { useAdminStore } from "../Admin/context/AdminContext";

// Classes escritas por extenso: o Tailwind não gera cores montadas com `bg-${cor}-600`
const FILTROS = [
  {
    tipo: "PERDIDO",
    label: "Perdidos",
    ativo: "bg-red-600 text-white border-red-600",
    inativo:
      "text-red-100 border-red-300/60 hover:bg-red-600/90 hover:text-white",
  },
  {
    tipo: "ENCONTRADO",
    label: "Encontrados",
    ativo: "bg-emerald-600 text-white border-emerald-600",
    inativo:
      "text-emerald-100 border-emerald-300/60 hover:bg-emerald-600/90 hover:text-white",
  },
  {
    tipo: "ADOCAO",
    label: "Para adoção",
    ativo: "bg-white text-blue-900 border-white",
    inativo:
      "text-blue-100 border-blue-200/60 hover:bg-white hover:text-blue-900",
  },
];

export default function Listagem() {
  const [animais, setAnimais] = useState<Animal[]>([]);
  const [animaisOriginais, setAnimaisOriginais] = useState<Animal[]>([]);
  const [cardSelecionado, setCardSelecionado] =
    useState<AnimalComUsuario | null>(null);
  const [tipoAtivo, setTipoAtivo] = useState<string | null>(null);
  const [animalParaExcluir, setAnimalParaExcluir] = useState<number | null>(
    null,
  );
  const [visao, setVisao] = useState<"carrossel" | "grade">("carrossel");
  const [searchParams, setSearchParams] = useSearchParams();

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
      const res = await fetch(`${apiUrl}/animais/${animalId}`);
      if (!res.ok) throw new Error("Erro ao buscar animal");
      const animalCompleto: AnimalComUsuario = await res.json();
      setCardSelecionado(animalCompleto);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar dados do animal");
    }
  };

  // 🔹 Link compartilhado (?animal=ID) abre o card direto
  useEffect(() => {
    const id = Number(searchParams.get("animal"));
    if (id) handleVerDetalhes(id);
  }, []);

  const fecharCard = () => {
    setCardSelecionado(null);
    if (searchParams.has("animal")) setSearchParams({});
  };

  // 🔹 Remover animal da lista local
  const handleExcluido = (id: number) => {
    setAnimais((prev) => prev.filter((a) => a.id !== id));
    setAnimaisOriginais((prev) => prev.filter((a) => a.id !== id));
    if (cardSelecionado?.id === id) fecharCard();
  };

  // 🔹 Exclusão admin
  const excluirAnimal = async (id: number) => {
    setAnimalParaExcluir(id);
  };

  const confirmarExclusaoAnimal = async () => {
    if (!animalParaExcluir) return;

    try {
      const token = admin?.token;
      if (!token) {
        toast.error("Você precisa estar logado como administrador");
        setAnimalParaExcluir(null);
        return;
      }

      const res = await fetch(`${apiUrl}/animais/${animalParaExcluir}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error("Erro ao excluir");

      toast.success("Animal excluído com sucesso!");
      handleExcluido(animalParaExcluir);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao excluir animal");
    } finally {
      setAnimalParaExcluir(null);
    }
  };

  // 🔹 Cards prontos para o carrossel ou para a grade
  const cards = animais.map((animal) => (
    <CardAnimal
      key={animal.id}
      data={animal}
      onFazerContato={() => handleVerDetalhes(animal.id)}
      isAdmin={isAdmin}
      onExcluir={excluirAnimal}
    />
  ));

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <header className="relative overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-blue-700 px-4 pb-16 pt-14 text-center text-white">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-amber-300/10 blur-3xl" />

        <div className="relative mx-auto max-w-3xl">
          <h1 className="text-4xl font-extrabold tracking-tight md:text-6xl">
            Todo pet merece voltar pra casa
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-blue-100 md:text-lg">
            Animais perdidos, encontrados e para adoção em Pelotas, num só lugar.
          </p>

          <div className="mt-8 rounded-3xl bg-white/10 p-2 ring-1 ring-white/20 backdrop-blur">
            <InputPesquisa
              setAnimais={(dados) => {
                setAnimais(dados);
                setAnimaisOriginais(dados);
                setTipoAtivo(null);
              }}
            />
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-2 sm:gap-3">
            {FILTROS.map((f) => (
              <button
                key={f.tipo}
                type="button"
                onClick={() => filtrarPorTipo(f.tipo)}
                aria-pressed={tipoAtivo === f.tipo}
                className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-semibold transition sm:text-base ${
                  tipoAtivo === f.tipo ? f.ativo : f.inativo
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Carrossel, grade ou detalhe */}
      <section className="flex justify-center px-4 mt-8 pb-16">
        {cardSelecionado ? (
          <CardExpandido
            animal={cardSelecionado}
            onClose={fecharCard}
            onExcluido={() =>
              cardSelecionado && handleExcluido(cardSelecionado.id)
            }
          />
        ) : (
          <div className="w-full">
            <div className="mx-auto mb-2 flex max-w-7xl items-center justify-between px-2 md:px-12">
              <p className="text-sm font-medium text-slate-600">
                {animais.length} {animais.length === 1 ? "animal" : "animais"}
              </p>

              <div className="inline-flex rounded-full bg-white p-1 text-sm font-semibold shadow ring-1 ring-slate-200">
                {(["carrossel", "grade"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setVisao(v)}
                    className={`cursor-pointer rounded-full px-4 py-1.5 capitalize transition ${
                      visao === v
                        ? "bg-blue-900 text-white"
                        : "text-slate-600 hover:text-blue-900"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {animais.length === 0 ? (
              <p className="py-16 text-center text-gray-500">
                Nenhum animal encontrado
              </p>
            ) : visao === "carrossel" ? (
              <Carrossel>{cards}</Carrossel>
            ) : (
              <div className="mx-auto grid max-w-7xl justify-center gap-6 pt-6 [grid-template-columns:repeat(auto-fit,minmax(250px,300px))]">
                {cards}
              </div>
            )}
          </div>
        )}
      </section>

      <ConfirmacaoExclusao
        aberto={animalParaExcluir !== null}
        titulo="Excluir animal?"
        mensagem="Deseja realmente excluir este animal? Essa ação não pode ser desfeita."
        textoConfirmar="Sim, excluir"
        onCancelar={() => setAnimalParaExcluir(null)}
        onConfirmar={confirmarExclusaoAnimal}
      />
    </div>
  );
}