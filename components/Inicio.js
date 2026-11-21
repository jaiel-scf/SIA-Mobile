import { ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import BlocksIcon from "../assets/icons/blocks.svg";
import CartaoBoasVindas from "./CartaoBoasVindas";
import IndicadoresDashboard from "./IndicadoresDashboard";
import DashboardUsuario from "./DashboardUsuario";

export default function Inicio({ usuario, voltarParaLogin, escuro, alternarTema, irParaEstoque, irParaSaidas }) {
  const cores = {
    fundo: escuro ? "#0f172a" : "#F4F7FC",
    texto: escuro ? "#f1f5f9" : "#0F172A",
    secundario: escuro ? "#94a3b8" : "#64748B",
  };

  return (
    <View style={[styles.container, { backgroundColor: cores.fundo }]}>
      <ScrollView contentContainerStyle={styles.conteudo} showsVerticalScrollIndicator={false}>
        <View style={styles.cabecalho}>
          <LinearGradient colors={["#2563EB", "#38BDF8"]} style={styles.logo}>
            <BlocksIcon width={29} height={29} color="#FFFFFF" />
          </LinearGradient>
          <View style={styles.titulos}>
            <Text style={[styles.titulo, { color: cores.texto }]}>SIA</Text>
            <Text style={{ color: cores.secundario }}>Sistema de Almoxarifado</Text>
          </View>
        </View>

        <CartaoBoasVindas nome={usuario?.nome || "Usuário"} perfil={String(usuario?.perfil ?? "").toLowerCase() === "admin" ? "Administrador" : "Usuário"} />

        <Text style={[styles.secao, { color: cores.texto }]}>{String(usuario?.perfil ?? "").toLowerCase() === "admin" ? "Dashboard" : "Meu painel"}</Text>
        {String(usuario?.perfil ?? "").toLowerCase() === "admin" ? (
          <IndicadoresDashboard usuario={usuario} escuro={escuro} irParaEstoque={irParaEstoque} irParaSaidas={irParaSaidas} />
        ) : (
          <DashboardUsuario usuario={usuario} escuro={escuro} irParaEstoque={irParaEstoque} irParaSaidas={irParaSaidas} />
        )}

      </ScrollView>


    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  conteudo: { paddingHorizontal: 20, paddingTop: 46, paddingBottom: 28 },
  cabecalho: { flexDirection: "row", alignItems: "center", marginBottom: 24 },
  logo: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  titulos: { flex: 1, marginLeft: 12 },
  titulo: { fontSize: 24, fontWeight: "800" },
  avatar: { width: 46, height: 46, borderWidth: 1, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  boasVindas: { padding: 22, borderRadius: 20, marginBottom: 26 },
  saudacao: { color: "#BFDBFE", fontSize: 14 },
  nome: { color: "#FFFFFF", fontSize: 24, fontWeight: "800", marginTop: 5 },
  perfil: { color: "#DBEAFE", marginTop: 8 },
  secao: { fontSize: 18, fontWeight: "800", marginBottom: 13 },
  card: { borderRadius: 17, borderWidth: 1, padding: 20, marginBottom: 25 },
  cardTitulo: { fontSize: 15, fontWeight: "700", marginBottom: 5 },
  descricao: { fontSize: 13, lineHeight: 21 },
  sobreposicao: { flex: 1, backgroundColor: "#00000088", justifyContent: "center", padding: 20 },
  menuConta: { borderRadius: 18, paddingVertical: 12, paddingHorizontal: 18, maxWidth: 420, width: "100%", alignSelf: "center" },
  menuCabecalho: { fontSize: 11, fontWeight: "700", letterSpacing: 1.3, marginTop: 10 },
  menuNome: { fontSize: 19, fontWeight: "800", marginTop: 12 },
  menuPerfil: { fontSize: 13, marginBottom: 12 },
  linha: { paddingVertical: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#94A3B866" },
  opcao: { fontSize: 15, fontWeight: "600" },
  preferencias: { borderRadius: 20, padding: 22, maxWidth: 420, width: "100%", alignSelf: "center" },
  fechar: { alignItems: "center", marginTop: 18, paddingVertical: 12 },
  fecharTexto: { color: "#3B82F6", fontWeight: "700" },
  campoRotulo: { fontSize: 12, fontWeight: "700", marginTop: 12, marginBottom: 6 },
  campoPerfil: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 15 },
  campoSenhaContainer: { borderWidth: 1, borderRadius: 12, flexDirection: "row", alignItems: "center" },
  campoSenhaInput: { flex: 1, padding: 12, fontSize: 15, minWidth: 0 },
  botaoVisibilidade: { paddingHorizontal: 14, paddingVertical: 10 },
  campoSomenteLeitura: { borderRadius: 12, padding: 13, fontSize: 14 },
  salvarPerfil: { backgroundColor: "#2563EB", padding: 14, borderRadius: 12, alignItems: "center", marginTop: 22 },
  salvarPerfilTexto: { color: "#FFFFFF", fontWeight: "700" },
});
