import { useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import BlocksIcon from "../assets/icons/blocks.svg";
import BotaoTema from "./BotaoTema";
import CartaoBoasVindas from "./CartaoBoasVindas";
import IndicadoresDashboard from "./IndicadoresDashboard";

export default function Inicio({ usuario, voltarParaLogin, escuro, alternarTema }) {
  const [menuAberto, setMenuAberto] = useState(false);
  const [preferencias, setPreferencias] = useState(false);
  const administrador = String(usuario?.perfil ?? "").toLowerCase() === "admin";
  const perfil = administrador ? "Administrador" : "Usuário";

  const cores = {
    fundo: escuro ? "#0B1220" : "#F4F7FC",
    card: escuro ? "#17233A" : "#FFFFFF",
    texto: escuro ? "#F8FAFC" : "#0F172A",
    secundario: escuro ? "#A9B9D0" : "#64748B",
    borda: escuro ? "#2B3B54" : "#E7EDF5",
  };

  function aviso(titulo) {
    setMenuAberto(false);
    Alert.alert(titulo, "Estamos verificando a integração segura com o backend antes de liberar esta função.");
  }

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
          <Pressable
            onPress={() => setMenuAberto(true)}
            accessibilityRole="button"
            accessibilityLabel="Abrir menu da minha conta"
            style={[styles.avatar, { backgroundColor: cores.card, borderColor: cores.borda }]}
          >
            <Text style={{ fontSize: 22 }}>👤</Text>
          </Pressable>
        </View>

        <CartaoBoasVindas nome={usuario?.nome || "Usuário"} perfil={perfil} />

        <Text style={[styles.secao, { color: cores.texto }]}>Dashboard</Text>
        <IndicadoresDashboard usuario={usuario} escuro={escuro} />

      </ScrollView>

      <Modal transparent visible={menuAberto} animationType="fade" onRequestClose={() => setMenuAberto(false)}>
        <Pressable style={styles.sobreposicao} onPress={() => setMenuAberto(false)}>
          <View style={[styles.menuConta, { backgroundColor: cores.card }]}>
            <Text style={[styles.menuCabecalho, { color: cores.secundario }]}>MINHA CONTA</Text>
            <Text style={[styles.menuNome, { color: cores.texto }]}>{usuario?.nome || "Usuário"}</Text>
            <Text style={[styles.menuPerfil, { color: cores.secundario }]}>{perfil}</Text>
            <Pressable style={styles.linha} onPress={() => aviso("Meu perfil")}>
              <Text style={[styles.opcao, { color: cores.texto }]}>👤   Meu perfil</Text>
            </Pressable>
            <Pressable style={styles.linha} onPress={() => aviso("Alterar senha")}>
              <Text style={[styles.opcao, { color: cores.texto }]}>🔒   Alterar senha</Text>
            </Pressable>
            <Pressable style={styles.linha} onPress={() => { setMenuAberto(false); setPreferencias(true); }}>
              <Text style={[styles.opcao, { color: cores.texto }]}>⚙️   Preferências</Text>
            </Pressable>
            <Pressable style={styles.linha} onPress={() => { setMenuAberto(false); voltarParaLogin(); }}>
              <Text style={[styles.opcao, { color: "#DC2626" }]}>↪   Sair do sistema</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <Modal transparent visible={preferencias} animationType="fade" onRequestClose={() => setPreferencias(false)}>
        <View style={styles.sobreposicao}>
          <View style={[styles.preferencias, { backgroundColor: cores.card }]}>
            <Text style={[styles.secao, { color: cores.texto }]}>Preferências</Text>
            <Text style={[styles.descricao, { color: cores.secundario }]}>Aparência do SIA-Mobile</Text>
            <BotaoTema escuro={escuro} aoPressionar={alternarTema} />
            <Pressable style={styles.fechar} onPress={() => setPreferencias(false)}>
              <Text style={styles.fecharTexto}>Concluir</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
});
