import { useEffect, useState } from "react";
import { VictoryPie } from "victory";
import axios from "axios";

export default function Admin() {
  const [dados, setDados] = useState<{ adocao: number; perdido: number; encontrado: number } | null>(null);

  useEffect(() => {
    async function fetchDados() {
      try {
        const res = await axios.get("https://emergentes-aula1-main-vb57.vercel.app/animais/animais/resumo");
        setDados(res.data);
      } catch (err) {
        console.error("Erro ao buscar dados do gráfico:", err);
      }
    }

    fetchDados();
  }, []);

  const data = dados
    ? [
        { x: "Adoção", y: dados.adocao },
        { x: "Perdidos", y: dados.perdido },
        { x: "Encontrados", y: dados.encontrado },
      ]
    : [];

  return (
    <div className="flex min-h-screen bg-gray-100">
     

    
      <main className="flex-1 p-10 flex flex-col items-center justify-center h-200">
        <h1 className="text-3xl font-bold mb-10">Estatísticas: Animais</h1>

        {dados ? (
          <VictoryPie
  data={data}
  colorScale={["#86efac", "#fde68a", "#fca5a5"]} 
  labels={({ datum }) => `${datum.x}: ${datum.y}`}
  labelPosition="centroid"
  style={{
    labels: {
      fontSize: 10,
      fill: "#4b5563",
      fontWeight: "bold",
    },
    data: {
      stroke: "#fff",
      strokeWidth: 2,
    },
  }}
  innerRadius={30} // efeito de donut chart
  height={200}
  width={200}
  padding={{ top: 20, bottom: 60, left: 60, right: 60 }}
  animate={{
    duration: 800,
    easing: "bounce",
  }}
/>

        ) : (
          <p className="text-gray-500">Carregando gráfico...</p>
        )}
      </main>
    </div>
  );
}
