import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { API_URL } from "../config/api";

export default function DashboardUsuario({ usuario, escuro = false, irParaEstoque, irParaSaidas }) {
  const [requisicoes, setRequisicoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [atualizacao, setAtualizacao] = useState(0);
  const cores = {
    fundo: escuro ? "#1e293b" : "#FFFFFF",
    borda: escuro ? "#334155" : "#E7EDF5",
    texto: escuro ? "#f1f5f9" : "#0F172A",
    secundario: escuro ? "#94a3b8" : "#64748B",
    suave: escuro ? "#243247" : "#EFF6FF",
  };

  useFocusEffect(useCallback(() => {
    let ativo = true;
    async function carregar() {
      setCarregando(true);
      setErro("");
      if (usuario?.id == null || !usuario?.token) {
        setErro("Não foi possível identificar sua sessão. Entre novamente.");
        setCarregando(false);
        return;
      }
      try {
        const resposta = await fetch(`${API_URL}/movimentacoes/requisicoes`, {
          headers: { Authorization: `Bearer ${usuario.token}` },
        });
        if (!resposta.ok) throw new Error(resposta.status === 401
          ? "Sua sessão expirou. Entre novamente."
          : "Não foi possível carregar suas requisições.");
        const lista = await resposta.json();
        if (!Array.isArray(lista)) throw new Error("O servidor retornou dados inesperados.");
        // Não apresentar requisições de outros usuários como se fossem pessoais.
        const minhas = lista.filter((item) => String(item.usuarioId) === String(usuario.id));
        if (ativo) setRequisicoes(minhas);
      } catch (falha) {
        if (ativo) setErro(falha.message || "Erro ao consultar requisições.");
      } finally {
        if (ativo) setCarregando(false);
      }
    }
    carregar();
    return () => { ativo = false; };
  }, [usuario?.id, usuario?.token, atualizacao]));

  const total = requisicoes.length;
  const aguardando = requisicoes.filter((item) => item.status === "AGUARDANDO").length;
  const finalizadas = requisicoes.filter((item) => item.status === "FINALIZADO").length;

  const cards = [
    { titulo: "Consultar estoque", valor: "📦", detalhe: "Pesquisar materiais disponíveis", acao: irParaEstoque },
    { titulo: "Minhas requisições", valor: String(total), detalhe: "Ver minhas solicitações", acao: irParaSaidas },
    { titulo: "Aguardando autorização", valor: String(aguardando), detalhe: "Acompanhar pendências", acao: irParaSaidas },
    { titulo: "Finalizadas", valor: String(finalizadas), detalhe: "Consultar solicitações concluídas", acao: irParaSaidas },
  ];

  return (
    <View style={styles.painel}>
      <Text style={[styles.subtitulo, { color: cores.secundario }]}>Seu espaço para consultar materiais e acompanhar solicitações.</Text>
      {carregando ? (
        <View style={styles.estado}><ActivityIndicator color="#3B82F6" /><Text style={{ color: cores.secundario, marginTop: 8 }}>Carregando suas atividades...</Text></View>
      ) : erro ? (
        <View style={[styles.estado, { backgroundColor: cores.fundo, borderColor: cores.borda, borderWidth: 1, borderRadius: 16 }]}>
          <Text style={{ color: cores.texto, textAlign: "center" }}>{erro}</Text>
          <Pressable onPress={() => setAtualizacao((valor) => valor + 1)} style={styles.botao}><Text style={styles.botaoTexto}>Tentar novamente</Text></Pressable>
        </View>
      ) : (
        <>
          <View style={styles.grade}>
            {cards.map((card) => (
              <Pressable key={card.titulo} onPress={card.acao} accessibilityRole="button"
                style={[styles.card, { backgroundColor: cores.fundo, borderColor: cores.borda }]}>
                <View style={[styles.icone, { backgroundColor: cores.suave }]}>
                  <Text style={styles.numero}>{card.valor}</Text>
                </View>
                <Text style={[styles.titulo, { color: cores.texto }]}>{card.titulo}</Text>
                <Text style={[styles.detalhe, { color: cores.secundario }]}>{card.detalhe} ›</Text>
              </Pressable>
            ))}
          </View>
          <Pressable onPress={irParaSaidas} style={styles.acao}>
            <Text style={styles.acaoTitulo}>📋  Fazer uma requisição</Text>
            <Text style={styles.acaoDetalhe}>Acessar a tela de Requisições ›</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  painel: { gap: 14, paddingBottom: 16 },
  subtitulo: { fontSize: 13, lineHeight: 20, marginBottom: 2 },
  grade: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  card: { width: "48%", flexGrow: 1, borderRadius: 18, borderWidth: 1, padding: 16, minHeight: 160, justifyContent: "space-between" },
  icone: { width: 56, height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  numero: { color: "#2563EB", fontSize: 26, fontWeight: "800" },
  titulo: { fontSize: 15, fontWeight: "800", marginTop: 10 },
  detalhe: { fontSize: 12, lineHeight: 17, marginTop: 6 },
  acao: { backgroundColor: "#2563EB", borderRadius: 17, padding: 19, gap: 5 },
  acaoTitulo: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
  acaoDetalhe: { color: "#DBEAFE", fontSize: 12 },
  estado: { alignItems: "center", padding: 24 },
  botao: { backgroundColor: "#2563EB", borderRadius: 10, padding: 12, marginTop: 12 },
  botaoTexto: { color: "#FFFFFF", fontWeight: "700" },
});
