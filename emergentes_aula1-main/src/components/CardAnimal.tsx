import type { Animal } from "../utils/animalType";

type CardAnimalProps = {
  data: Animal;
  onFazerContato?: () => void;
  onExcluir?: (id: number) => void;
  isAdmin?: boolean;
};

export function CardAnimal({
  data,
  onFazerContato,
  onExcluir,
  isAdmin,
}: CardAnimalProps) {
  const tipoConfig: Record<string, { label: string; bg: string }> = {
    PERDIDO: { label: "Perdido", bg: "bg-red-500" },
    ENCONTRADO: { label: "Encontrado", bg: "bg-green-500" },
    ADOCAO: { label: "Adoção", bg: "bg-blue-500" },
  };

  const tipo = tipoConfig[data.tipo];

  return (
    <div
      className={`bg-white rounded-xl shadow-md overflow-hidden w-full max-w-xs mx-auto hover:shadow-lg transition flex flex-col ${
        isAdmin ? "min-h-[430px] h-auto" : "h-[380px]"
      }`}
    >
      {/* Imagem */}
      <div className="relative h-48 flex-shrink-0">
        <img
          src={data.urlImagem}
          alt={data.nome}
          className="w-full h-full object-cover"
        />
        {/* Badge */}
        <span
          className={`absolute bottom-3 left-1/2 -translate-x-1/2 px-5 py-1 text-sm font-semibold text-white rounded-full ${tipo.bg}`}
        >
          {tipo.label}
        </span>
      </div>

      {/* Conteúdo */}
      <div className="p-4 text-center flex-1 flex flex-col justify-between">
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
          {data.nome}
        </h3>
        <div className="w-12 h-[2px] bg-gray-300 mx-auto my-2 rounded-full" />
        <p className="text-gray-600 text-sm">
          Raça: <span className="font-medium">{data.raca}</span>
        </p>

        {/* Botão Ver Detalhes */}
        <button
          onClick={onFazerContato}
          className="mt-4 w-full bg-blue-900 hover:bg-blue-800 text-white py-2 rounded-md font-semibold transition cursor-pointer"
        >
          Ver Detalhes
        </button>

        {/* Botão Excluir (Admin) */}
        {isAdmin && onExcluir && (
          <button
            onClick={() => onExcluir(data.id)}
            className="mt-2 w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-md font-semibold transition cursor-pointer"
          >
            Excluir
          </button>
        )}
      </div>
    </div>
  );
}
