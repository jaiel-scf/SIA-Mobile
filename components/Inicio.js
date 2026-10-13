import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { LinearGradient } from "expo-linear-gradient";

// Ícone oficial do SIA
import BlocksIcon from "../assets/icons/blocks.svg";

// Ícones das funcionalidades
import ClipboardListIcon from "../assets/icons/clipboard-list.svg";
import PackagePlusIcon from "../assets/icons/package-plus.svg";
import SendIcon from "../assets/icons/send.svg";
import UserPlusIcon from "../assets/icons/user-plus.svg";
import LogOutIcon from "../assets/icons/log-out.svg";

export default function Inicio({
  usuario,
  irParaEstoque,
  irParaEntradas,
  irParaSaidas,
  irParaUsuarios,
  voltarParaLogin,
}) {
  // Identifica o administrador
  const administrador = String(usuario?.perfil ?? "").toLowerCase() === "admin";

  // Nome do perfil exibido no card
  const nomePerfil = administrador ? "Administrador" : "Usuário";

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.conteudo}>
        {/* Cabeçalho */}
        <View style={styles.cabecalho}>
          {/* Ícone oficial com o degradê do Login */}
          <LinearGradient colors={["#2563eb", "#38bdf8"]} style={styles.logo}>
            <BlocksIcon width={30} height={30} color="#ffffff" />
          </LinearGradient>

          {/* Nome do sistema */}
          <View style={styles.areaTitulo}>
            <Text style={styles.titulo}>SIA</Text>

            <Text style={styles.subtitulo}>Sistema de Almoxarifado</Text>
          </View>

          {/* Sair */}
          <Pressable style={styles.botaoSair} onPress={voltarParaLogin}>
            <LogOutIcon width={22} height={22} color="#475569" />
          </Pressable>
        </View>

        {/* Boas-vindas */}
        <View style={styles.cardBoasVindas}>
          <Text style={styles.textoBemVindo}>Bem-vindo</Text>

          <Text style={styles.nomeUsuario}>{usuario?.nome || "Usuário"}</Text>

          {/* Perfil sem aparência de botão */}
          <Text style={styles.textoPerfil}>{nomePerfil}</Text>
        </View>

        {/* Acesso rápido */}
        <Text style={styles.tituloSecao}>Acesso rápido</Text>

        {/* Estoque - todos os usuários */}
        <Pressable style={styles.cardMenu} onPress={irParaEstoque}>
          <View style={styles.iconeAzul}>
            <ClipboardListIcon width={27} height={27} color="#ffffff" />
          </View>

          <View style={styles.textoMenu}>
            <Text style={styles.menuTitulo}>Estoque</Text>

            <Text style={styles.menuDescricao}>Consultar produtos e quantidades</Text>
          </View>

          <Text style={styles.seta}>›</Text>
        </Pressable>

        {/* Entradas - somente administrador */}
        {administrador && (
          <Pressable style={styles.cardMenu} onPress={irParaEntradas}>
            <View style={styles.iconeVerde}>
              <PackagePlusIcon width={27} height={27} color="#ffffff" />
            </View>

            <View style={styles.textoMenu}>
              <Text style={styles.menuTitulo}>Entradas</Text>

              <Text style={styles.menuDescricao}>Registrar entrada de produtos</Text>
            </View>

            <Text style={styles.seta}>›</Text>
          </Pressable>
        )}

        {/* Requisições - todos os usuários */}
        <Pressable style={styles.cardMenu} onPress={irParaSaidas}>
          <View style={styles.iconeLaranja}>
            <SendIcon width={27} height={27} color="#ffffff" />
          </View>

          <View style={styles.textoMenu}>
            <Text style={styles.menuTitulo}>Requisições</Text>

            <Text style={styles.menuDescricao}>Registrar retirada de produtos</Text>
          </View>

          <Text style={styles.seta}>›</Text>
        </Pressable>

        {/* Usuários - somente administrador */}
        {administrador && (
          <Pressable style={styles.cardMenu} onPress={irParaUsuarios}>
            <View style={styles.iconeRoxo}>
              <UserPlusIcon width={27} height={27} color="#ffffff" />
            </View>

            <View style={styles.textoMenu}>
              <Text style={styles.menuTitulo}>Usuários</Text>

              <Text style={styles.menuDescricao}>Cadastrar usuários do sistema</Text>
            </View>

            <Text style={styles.seta}>›</Text>
          </Pressable>
        )}

        {/* Rodapé */}
        <Text style={styles.rodape}>Sistema de Almoxarifado • 2026</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Fundo principal
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },

  // Espaçamento
  conteudo: {
    paddingHorizontal: 20,
    paddingTop: 55,
    paddingBottom: 35,
  },

  // Cabeçalho
  cabecalho: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
  },

  // Ícone igual ao Login
  logo: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  areaTitulo: {
    flex: 1,
  },

  titulo: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0f172a",
  },

  subtitulo: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
  },

  // Botão sair
  botaoSair: {
    width: 43,
    height: 43,
    borderRadius: 12,
    backgroundColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },

  // Boas-vindas
  cardBoasVindas: {
    backgroundColor: "#1e40af",
    borderRadius: 18,
    padding: 20,
    marginBottom: 28,
  },

  textoBemVindo: {
    fontSize: 14,
    color: "#bfdbfe",
  },

  nomeUsuario: {
    fontSize: 23,
    fontWeight: "bold",
    color: "#ffffff",
    marginTop: 4,
  },

  // Perfil como texto, sem aparência de botão
  textoPerfil: {
    fontSize: 13,
    fontWeight: "500",
    color: "#bfdbfe",
    marginTop: 10,
  },

  // Acesso rápido
  tituloSecao: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 14,
  },

  // Cards dos menus
  cardMenu: {
    minHeight: 82,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 15,
    marginBottom: 13,
    flexDirection: "row",
    alignItems: "center",

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },

  // Estoque
  iconeAzul: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  // Entradas
  iconeVerde: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#16a34a",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  // Requisições
  iconeLaranja: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#ea580c",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  // Usuários
  iconeRoxo: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#7c3aed",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  textoMenu: {
    flex: 1,
  },

  menuTitulo: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0f172a",
  },

  menuDescricao: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 3,
  },

  seta: {
    fontSize: 30,
    color: "#94a3b8",
    marginLeft: 8,
  },

  // Rodapé
  rodape: {
    textAlign: "center",
    color: "#94a3b8",
    fontSize: 12,
    marginTop: 18,
  },
});
