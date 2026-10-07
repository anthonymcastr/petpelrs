import { MapContainer, TileLayer, Circle, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type Props = {
  latitude: number;
  longitude: number;
  nome: string;
  urlImagem: string;
  raio?: number;
};

// Marcador com a foto do animal (montado com DOM para não injetar HTML solto)
function criarIcone(urlImagem: string, nome: string) {
  const moldura = document.createElement("div");
  moldura.style.cssText =
    "width:56px;height:56px;border-radius:9999px;border:3px solid #fff;" +
    "box-shadow:0 4px 14px rgba(30,64,175,.55);overflow:hidden;background:#e2e8f0";

  const img = document.createElement("img");
  img.src = urlImagem;
  img.alt = nome;
  img.style.cssText =
    "width:100%;height:100%;object-fit:cover;display:block";

  moldura.appendChild(img);

  return L.divIcon({
    html: moldura,
    className: "",
    iconSize: [56, 56],
    iconAnchor: [28, 28],
  });
}

export default function MapaAnimal({
  latitude,
  longitude,
  nome,
  urlImagem,
  raio = 300,
}: Props) {
  const centro: [number, number] = [latitude, longitude];

  return (
    <MapContainer
      center={centro}
      zoom={15}
      scrollWheelZoom
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <Circle
        center={centro}
        radius={raio}
        pathOptions={{
          color: "#1d4ed8",
          weight: 2,
          fillColor: "#3b82f6",
          fillOpacity: 0.18,
        }}
      />

      <Marker
        position={centro}
        icon={criarIcone(urlImagem, nome)}
        interactive={false}
      />
    </MapContainer>
  );
}