import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { API_URL } from "../config/api";
import { LinearGradient } from "expo-linear-gradient";

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
        setDados({
          produtos: produtos.length, estoqueBaixo, requisicoes: requisicoes.length,
          valorTotal: produtos.reduce((soma, p) => {
            const custo = p.custoMedio;
            return soma + (custo == null || custo === "" || !Number.isFinite(Number(custo)) || Number(custo) < 0 ? 0 : Number(custo) * Number(p.quantidade ?? 0));
          }, 0),
          semCusto: produtos.filter((p) => p.custoMedio == null || p.custoMedio === "" || !Number.isFinite(Number(p.custoMedio)) || Number(p.custoMedio) < 0).length,
        });
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

  const administrador = String(usuario?.perfil ?? "").toLowerCase() === "admin";
  const percentualBaixo = dados?.produtos ? Math.round(dados.estoqueBaixo / dados.produtos * 100) : 0;
  const moeda = (valor) => Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const indicadores = [
    { titulo: "Produtos cadastrados", valor: dados?.produtos, descricao: "Itens ativos no almoxarifado", icone: "▦", cor: "#2563EB", suave: "#DBEAFE" },
    { titulo: "Estoque baixo", valor: dados?.estoqueBaixo, descricao: "Itens no limite ou abaixo do mínimo", icone: "!", cor: "#EA580C", suave: "#FFEDD5" },
    { titulo: "Requisições", valor: dados?.requisicoes, descricao: "Registros disponíveis para seu perfil", icone: "≡", cor: "#7C3AED", suave: "#EDE9FE" },
    ...(administrador ? [{ titulo: "Sem custo médio", valor: dados?.semCusto, descricao: "Produtos sem custo informado", icone: "R$", cor: "#D97706", suave: "#FEF3C7" }] : []),
  ];

  return (
    <View style={styles.grade}>
      {administrador && (
        <LinearGradient colors={["#1D4ED8", "#2563EB", "#38BDF8"]} style={styles.destaque}>
          <View style={styles.destaqueTopo}>
            <Text style={styles.destaqueEtiqueta}>VISÃO FINANCEIRA</Text>
            <Text style={styles.destaqueSelo}>R$</Text>
          </View>
          <Text style={styles.destaqueRotulo}>Valor total do estoque</Text>
          <Text style={styles.destaqueValor} numberOfLines={1} adjustsFontSizeToFit>{moeda(dados.valorTotal)}</Text>
          <Text style={styles.destaqueNota}>
            {dados.semCusto > 0 ? "Valor parcial: há produtos sem custo informado" : "Custo médio multiplicado pela quantidade"}
          </Text>
        </LinearGradient>
      )}
      <View style={styles.cartoes}>
        {indicadores.map((item) => (
          <View key={item.titulo} style={[styles.cartao, { backgroundColor: fundo, borderColor: borda }]}>
            <View style={[styles.icone, { backgroundColor: escuro ? "#253550" : item.suave }]}>
              <Text style={[styles.iconeTexto, { color: item.cor }]}>{item.icone}</Text>
            </View>
            <Text style={[styles.numero, { color: texto }]}>{item.valor}</Text>
            <Text style={[styles.rotulo, { color: texto }]}>{item.titulo}</Text>
            <Text style={[styles.descricao, { color: secundario }]}>{item.descricao}</Text>
          </View>
        ))}
      </View>
      <View style={[styles.saude, { backgroundColor: fundo, borderColor: borda }]}>
        <View style={styles.saudeTopo}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.saudeTitulo, { color: texto }]}>Atenção ao estoque</Text>
            <Text style={[styles.descricao, { color: secundario }]}>Produtos no limite ou abaixo do mínimo</Text>
          </View>
          <Text style={[styles.percentual, { color: percentualBaixo ? "#EA580C" : "#16A34A" }]}>{percentualBaixo}%</Text>
        </View>
        <View style={[styles.barra, { backgroundColor: escuro ? "#2B3B54" : "#E7EDF5" }]}>
          <View style={{ width: percentualBaixo + "%", height: "100%", backgroundColor: "#EA580C", borderRadius: 8 }} />
        </View>
        <Text style={[styles.descricao, { color: secundario }]}>
          {dados.estoqueBaixo} de {dados.produtos} produtos precisam de atenção
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grade: { gap: 14, paddingBottom: 12 },
  destaque: { borderRadius: 20, padding: 22, minHeight: 174 },
  destaqueTopo: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  destaqueEtiqueta: { color: "#DBEAFE", fontSize: 10, fontWeight: "800", letterSpacing: 1.5 },
  destaqueSelo: { color: "#FFFFFF", fontWeight: "800", backgroundColor: "#FFFFFF25", padding: 9, borderRadius: 12 },
  destaqueRotulo: { color: "#DBEAFE", fontSize: 13, marginTop: 15 },
  destaqueValor: { color: "#FFFFFF", fontSize: 34, fontWeight: "800", marginTop: 5 },
  destaqueNota: { color: "#E0F2FE", fontSize: 11, marginTop: 10 },
  cartoes: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  cartao: { flexGrow: 1, flexBasis: "45%", minWidth: 130, minHeight: 166, borderRadius: 18, borderWidth: 1, padding: 16 },
  icone: { width: 38, height: 38, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  iconeTexto: { fontSize: 17, fontWeight: "800" },
  numero: { fontSize: 29, fontWeight: "800", marginTop: 12 },
  rotulo: { fontSize: 13, fontWeight: "700", marginTop: 4 },
  descricao: { fontSize: 11, lineHeight: 16, marginTop: 5 },
  saude: { borderWidth: 1, borderRadius: 18, padding: 18 },
  saudeTopo: { flexDirection: "row", alignItems: "center", gap: 10 },
  saudeTitulo: { fontSize: 15, fontWeight: "700" },
  percentual: { fontSize: 23, fontWeight: "800" },
  barra: { height: 9, borderRadius: 8, marginTop: 16, overflow: "hidden" },
  estado: { padding: 24, alignItems: "center", borderRadius: 16 },
  tentar: { backgroundColor: "#2563EB", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, marginTop: 15 },
  tentarTexto: { color: "#FFFFFF", fontWeight: "700" },
});
