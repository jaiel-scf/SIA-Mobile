import { useEffect, useState } from "react";
import { Image, Text, View } from "react-native";
import { API_URL } from "../config/api";

const cacheFotos = new Map();

export default function MiniaturaMaterial({ produto, token, tamanho = 52 }) {
  const [uri, setUri] = useState(null);
  const [falhou, setFalhou] = useState(false);

  useEffect(() => {
    let ativo = true;
    setUri(null);
    setFalhou(false);
    if (!produto?.id || !token) return () => { ativo = false; };
    let promessa = cacheFotos.get(produto.id);
    if (!promessa) {
      promessa = (async () => {
        try {
          const resposta = await fetch(`${API_URL}/produtos/${produto.id}/imagem`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!resposta.ok) return null;
          const blob = await resposta.blob();
          return await new Promise((resolve) => {
            const leitor = new FileReader();
            leitor.onload = () => resolve(typeof leitor.result === "string" ? leitor.result : null);
            leitor.onerror = () => resolve(null);
            leitor.readAsDataURL(blob);
          });
        } catch {
          return null;
        }
      })();
      cacheFotos.set(produto.id, promessa);
    }
    promessa.then((imagem) => {
      if (!ativo) return;
      if (imagem) setUri(imagem);
      else setFalhou(true);
    });
    return () => { ativo = false; };
  }, [produto?.id, token]);

  return (
    <View style={{ width: tamanho, height: tamanho, borderRadius: 9, overflow: "hidden", backgroundColor: "#e2e8f0", alignItems: "center", justifyContent: "center", marginRight: 12 }}>
      {uri && !falhou ? (
        <Image source={{ uri }} style={{ width: tamanho, height: tamanho }} resizeMode="cover" />
      ) : (
        <Text style={{ fontSize: 9, color: "#64748b", textAlign: "center" }}>{falhou ? "Sem foto" : "Carregando"}</Text>
      )}
    </View>
  );
}
