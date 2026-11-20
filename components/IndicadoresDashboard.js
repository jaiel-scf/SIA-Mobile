import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { API_URL } from "../config/api";

export default function IndicadoresDashboard({ usuario, escuro }) {
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [atualizacao, setAtualizacao] = useState(0);

  const carregar = useCallback(async (ativo) => {
    setCarregando(true);
    setErro("");
    if (!usuario?.token) {
      if (ativo()) {
        setErro("Faça login novamente para consultar os indicadores.");
        setCarregando(false);
      }
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${usuario.token}` };
      const respostas = await Promise.all([
        fetch(`${API_URL}/produtos/listar`, { headers }),
        fetch(`${API_URL}/movimentacoes/requisicoes`, { headers }),
      ]);
      if (respostas.some((resposta) => resposta.status === 401)) {
        throw new Error("Sessão expirada. Faça login novamente.");
      }
      if (respostas.some((resposta) => !resposta.ok)) {
        throw new Error("Não foi possível consultar os indicadores.");
      }

      const [produtos, requisicoes] = await Promise.all(respostas.map((resposta) => resposta.json()));
      if (!Array.isArray(produtos) || !Array.isArray(requisicoes)) {
        throw new Error("O servidor retornou dados em formato inesperado.");
      }

      const estoqueBaixo = produtos.filter((produto) => {
        const quantidade = Number(produto.quantidade);
        const minimo = Number(produto.estoqueMinimo);
        return Number.isFinite(quantidade) && Number.isFinite(minimo) && quantidade <= minimo;
      }).length;

      if (ativo()) {
        setDados({ produtos: produtos.length, estoqueBaixo, requisicoes: requisicoes.length });
      }
    } catch (error) {
      if (ativo()) setErro(error.message || "Erro ao consultar os indicadores.");
    } finally {
      if (ativo()) setCarregando(false);
    }
  }, [usuario?.token]);

  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      carregar(() => ativo);
      return () => { ativo = false; };
    }, [carregar, atualizacao]),
  );

  const texto = escuro ? "#F8FAFC" : "#0F172A";
  const secundario = escuro ? "#A9B9D0" : "#64748B";
  const fundo = escuro ? "#17233A" : "#FFFFFF";
  const borda = escuro ? "#2B3B54" : "#E7EDF5";

  if (carregando) {
    return (
      <View style={styles.estado}>
        <ActivityIndicator color="#3B82F6" />
        <Text style={{ color: secundario, marginTop: 10 }}>Carregando indicadores...</Text>
      </View>
    );
  }

  if (erro) {
    return (
      <View style={[styles.estado, { backgroundColor: fundo, borderColor: borda, borderWidth: 1 }]}>
        <Text style={{ color: texto, textAlign: "center" }}>{erro}</Text>
        <Pressable onPress={() => setAtualizacao((valor) => valor + 1)} style={styles.tentar}>
          <Text style={styles.tentarTexto}>Tentar novamente</Text>
        </Pressable>
      </View>
    );
  }

  const indicadores = [
    { titulo: "Produtos cadastrados", valor: dados?.produtos, cor: "#2563EB" },
    { titulo: "Estoque baixo", valor: dados?.estoqueBaixo, cor: "#EA580C" },
    { titulo: "Requisições", valor: dados?.requisicoes, cor: "#7C3AED" },
  ];

  return (
    <View style={styles.grade}>
      {indicadores.map((indicador) => (
        <View key={indicador.titulo} style={[styles.cartao, { backgroundColor: fundo, borderColor: borda }]}>
          <View style={[styles.detalhe, { backgroundColor: indicador.cor }]} />
          <Text style={[styles.numero, { color: texto }]}>{indicador.valor}</Text>
          <Text style={[styles.rotulo, { color: secundario }]}>{indicador.titulo}</Text>
        </View>
      ))}
      <Text style={[styles.observacao, { color: secundario }]}>
        Requisições: total de registros disponibilizados pela API para seu perfil.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  grade: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  cartao: {
    flexGrow: 1,
    flexBasis: "45%",
    minWidth: 125,
    minHeight: 116,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    justifyContent: "center",
    overflow: "hidden",
  },
  detalhe: { position: "absolute", top: 0, left: 0, width: 4, height: "100%" },
  numero: { fontSize: 28, fontWeight: "800" },
  rotulo: { fontSize: 12, marginTop: 7, fontWeight: "600" },
  observacao: { fontSize: 11, lineHeight: 16, marginBottom: 10 },
  estado: { padding: 24, alignItems: "center", borderRadius: 16 },
  tentar: { backgroundColor: "#2563EB", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, marginTop: 15 },
  tentarTexto: { color: "#FFFFFF", fontWeight: "700" },
});
