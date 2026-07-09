import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { AnimalComUsuario } from "../utils/animalType";
import { useClienteStore } from "../context/ClienteContext";
import { ConfirmacaoExclusao } from "./ConfirmacaoExclusao";

type Props = {
  animal: AnimalComUsuario;
  onClose: () => void;
  onExcluido?: () => void;
};

export function CardExpandido({ animal, onClose, onExcluido }: Props) {
  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [exibindoConfirmacaoExclusao, setExibindoConfirmacaoExclusao] =
    useState(false);
  const { cliente } = useClienteStore();
  const navigate = useNavigate();

  const usuarioLogado = !!cliente;
  const isAdmin = cliente?.role === "admin";
  const apiUrl = import.meta.env.VITE_API_URL;

  const handleEnviar = async () => {
    if (!cliente?.id) return toast.error("Você precisa estar logado");
    if (!mensagem.trim()) return toast.error("Digite uma mensagem");

    const donoId = animal.usuario?.id || animal.usuarioId;

    if (!donoId) return toast.error("Erro: dono do animal não encontrado");

    if (cliente.id === donoId)
      return toast.error("Você não pode enviar mensagem para si mesmo");

    try {
      setEnviando(true);

      const payload = {
        mensagem,
        animalId: Number(animal.id),
        remetenteId: Number(cliente.id),
        destinatarioId: Number(donoId),
      };

      const res = await fetch(`${apiUrl}/contatos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const erro = await res.json();
        console.error("Erro da API:", erro);
        throw new Error(erro?.erro || "Erro ao enviar mensagem");
      }

      setMensagem("");
      toast.success("Mensagem enviada com sucesso!");
      onClose();
      navigate("/inbox");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao enviar mensagem");
    } finally {
      setEnviando(false);
    }
  };

  const handleExcluir = async () => {
    setExibindoConfirmacaoExclusao(true);
  };

  const confirmarExclusao = async () => {
    try {
      const token = cliente?.token;
      if (!token && !isAdmin) {
        toast.error("Apenas administradores podem excluir animais");
        return;
      }

      const res = await fetch(`${apiUrl}/animais/${animal.id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (!res.ok) throw new Error("Erro ao excluir animal");

      toast.success("Animal excluído com sucesso!");
      onExcluido?.();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao excluir animal");
    } finally {
      setExibindoConfirmacaoExclusao(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:font-bold hover:text-gray-800 hover:cursor-pointer text-xl font-bold"
        >
          ✕
        </button>

        <img
          src={animal.urlImagem}
          alt={animal.nome}
          className="w-full h-64 object-cover rounded-xl"
        />

        <div className="mt-4">
          <h2 className="text-2xl font-extrabold">{animal.nome}</h2>
          <p className="mt-1 text-gray-600">
            Raça: <strong>{animal.raca}</strong>
          </p>
          <p className="text-gray-600">
            Tipo: <strong>{animal.tipo}</strong>
          </p>
          <p className="text-gray-600">
            Idade: <strong>{animal.idade} anos</strong>
          </p>
          <p className="text-gray-600">
            Cidade: <strong>{animal.cidade}</strong>
          </p>
          <p className="text-gray-600">
            Responsável:{" "}
            <strong>{animal.usuario?.nome || "Não informado"}</strong>
          </p>
        </div>

        <textarea
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
          rows={4}
          placeholder={
            usuarioLogado
              ? "Escreva sua mensagem para o responsável..."
              : "Faça login para enviar mensagem"
          }
          disabled={!usuarioLogado || enviando}
          className="mt-4 w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
        />

        <button
          onClick={handleEnviar}
          disabled={!usuarioLogado || enviando}
          className={`mt-4 w-full py-2 rounded-lg font-semibold transition ${
            usuarioLogado
              ? "bg-green-600 hover:bg-green-700 text-white"
              : "bg-gray-300 text-gray-600 cursor-not-allowed"
          }`}
        >
          {enviando ? "Enviando..." : "Enviar mensagem"}
        </button>

        {isAdmin && (
          <button
            onClick={handleExcluir}
            className="mt-3 w-full py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold"
          >
            Excluir Animal (Admin)
          </button>
        )}

        <ConfirmacaoExclusao
          aberto={exibindoConfirmacaoExclusao}
          titulo="Excluir animal?"
          mensagem="Deseja realmente excluir este animal? Essa ação não pode ser desfeita."
          textoConfirmar="Sim, excluir"
          onCancelar={() => setExibindoConfirmacaoExclusao(false)}
          onConfirmar={confirmarExclusao}
        />
      </div>
    </div>
  );
}
