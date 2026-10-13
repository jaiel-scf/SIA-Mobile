import { useState } from "react";

import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";

import { API_URL } from "../config/api";

import BlocksIcon from "../assets/icons/blocks.svg";
import EyeIcon from "../assets/icons/eye.svg";
import EyeOffIcon from "../assets/icons/eye-off.svg";

export default function Login({ entrar }) {
  // Dados do login
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);

  // Recuperação de senha
  const [modalRecuperacao, setModalRecuperacao] = useState(false);
  const [emailRecuperacao, setEmailRecuperacao] = useState("");
  const [mensagemRecuperacao, setMensagemRecuperacao] = useState("");

  // Mensagens e carregamento
  const [mensagemLogin, setMensagemLogin] = useState("");
  const [entrando, setEntrando] = useState(false);
  const [recuperando, setRecuperando] = useState(false);

  // Abre o card de recuperação
  function abrirRecuperacao() {
    Keyboard.dismiss();

    setMensagemRecuperacao("");
    setMensagemLogin("");
    setEmailRecuperacao(email.trim());
    setModalRecuperacao(true);
  }

  // Fecha o card de recuperação
  function fecharRecuperacao() {
    if (recuperando) return;

    Keyboard.dismiss();

    setModalRecuperacao(false);
    setMensagemRecuperacao("");
  }

  // Solicita a recuperação de senha ao backend
  async function recuperarSenha() {
    if (recuperando) return;

    setMensagemRecuperacao("");

    const emailLimpo = emailRecuperacao.trim().toLowerCase();

    if (!emailLimpo) {
      Alert.alert("Erro", "Digite seu e-mail para recuperar a senha.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpo)) {
      Alert.alert("Erro", "Digite um e-mail válido.");
      return;
    }

    setRecuperando(true);

    try {
      const resposta = await fetch(`${API_URL}/auth/esqueci-senha`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: emailLimpo,
        }),
      });

      if (!resposta.ok) {
        throw new Error("Não foi possível solicitar a recuperação de senha.");
      }

      // O backend pode responder com uma mensagem JSON
      const textoResposta = await resposta.text();

      let dados = {};

      if (textoResposta) {
        try {
          dados = JSON.parse(textoResposta);
        } catch (error) {
          // Se a resposta não for JSON, usamos a mensagem padrão.
        }
      }

      setMensagemRecuperacao(
        dados.mensagem || "Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha.",
      );

      Keyboard.dismiss();
    } catch (erro) {
      console.error("Erro na recuperação de senha:", erro);

      Alert.alert(
        "Erro",
        erro.message === "Network request failed" ? "Não foi possível conectar ao servidor." : erro.message,
      );
    } finally {
      setRecuperando(false);
    }
  }

  // Faz o login usando o backend
  async function fazerLogin() {
    if (entrando) return;

    setMensagemRecuperacao("");
    setMensagemLogin("");

    const emailLimpo = email.trim().toLowerCase();

    if (!emailLimpo || !senha) {
      Alert.alert("Erro", "Preencha o e-mail e a senha.");
      return;
    }

    setEntrando(true);

    try {
      const resposta = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: emailLimpo,
          senha: senha,
        }),
      });

      if (resposta.status === 401 || resposta.status === 403) {
        Alert.alert("Erro", "E-mail ou senha incorretos.");
        return;
      }

      if (!resposta.ok) {
        throw new Error("Não foi possível realizar o login.");
      }

      const dadosUsuario = await resposta.json();

      if (!dadosUsuario || !dadosUsuario.token) {
        throw new Error("O servidor não retornou uma sessão válida.");
      }

      // Fecha o teclado antes de navegar
      Keyboard.dismiss();

      setMensagemLogin("Login realizado com sucesso.");

      // Entrega os dados ao App.js, que decide
      // se o usuário vai para o Início ou para
      // a redefinição obrigatória de senha.
      entrar(dadosUsuario);
    } catch (erro) {
      console.error("Erro ao fazer login:", erro);

      Alert.alert(
        "Erro",
        erro.message === "Network request failed" ? "Não foi possível conectar ao servidor." : erro.message,
      );
    } finally {
      setEntrando(false);
    }
  }

  return (
    <>
      {/* Fundo e teclado da tela Login */}
      <LinearGradient colors={["#0f172a", "#1e3a8a", "#1d4ed8"]} style={styles.container}>
        <KeyboardAvoidingView
          style={styles.areaTeclado}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={0}
        >
          <ScrollView
            style={styles.rolagemPrincipal}
            contentContainerStyle={styles.conteudoPrincipal}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="always"
            keyboardDismissMode="none"
            automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
          >
            {/* Card principal do Login */}
            <View style={styles.card}>
              <LinearGradient colors={["#2563eb", "#38bdf8"]} style={styles.logo}>
                <BlocksIcon width={38} height={38} color="#ffffff" />
              </LinearGradient>

              <Text style={styles.titulo}>SIA</Text>

              <Text style={styles.subtitulo}>Sistema de Almoxarifado</Text>

              {/* E-mail */}
              <Text style={styles.label}>E-mail</Text>

              <TextInput
                style={styles.input}
                placeholder="usuario@gmail.com"
                placeholderTextColor="#94a3b8"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                editable={!entrando}
              />

              {/* Senha */}
              <Text style={styles.label}>Senha</Text>

              <View style={styles.campoSenha}>
                <TextInput
                  style={styles.inputSenha}
                  placeholder="Digite sua senha"
                  placeholderTextColor="#94a3b8"
                  value={senha}
                  onChangeText={setSenha}
                  secureTextEntry={!mostrarSenha}
                  autoCapitalize="none"
                  editable={!entrando}
                />

                <Pressable style={styles.botaoOlho} onPress={() => setMostrarSenha(!mostrarSenha)}>
                  {mostrarSenha ? (
                    <EyeOffIcon width={22} height={22} color="#64748b" />
                  ) : (
                    <EyeIcon width={22} height={22} color="#64748b" />
                  )}
                </Pressable>
              </View>

              {/* Informações abaixo da senha */}
              <View style={styles.informacoes}>
                <Text style={styles.textoSecundario}>Acesso ao sistema</Text>

                <Pressable onPress={abrirRecuperacao}>
                  <Text style={styles.esqueciSenha}>Esqueci a senha</Text>
                </Pressable>
              </View>

              {/* Botão Entrar */}
              <Pressable
                disabled={entrando}
                onPress={fazerLogin}
                style={({ pressed }) => [styles.botaoEntrar, (pressed || entrando) && styles.botaoEntrarPressionado]}
              >
                <Text style={styles.textoBotao}>{entrando ? "Entrando..." : "Entrar"}</Text>
              </Pressable>

              {entrando && (
                <View style={styles.caixaEntrando}>
                  <Text style={styles.textoEntrando}>Verificando seus dados...</Text>
                </View>
              )}

              {!!mensagemLogin && (
                <View style={styles.caixaLoginSucesso}>
                  <Text style={styles.textoLoginSucesso}>✓ {mensagemLogin}</Text>
                </View>
              )}

              <Text style={styles.rodape}>Acesso ao Sistema de Almoxarifado</Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>

      {/* Card de recuperação de senha */}
      <Modal
        visible={modalRecuperacao}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={fecharRecuperacao}
      >
        <KeyboardAvoidingView
          style={styles.fundoModal}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={0}
        >
          <ScrollView
            style={styles.rolagemModal}
            contentContainerStyle={styles.conteudoRolagemModal}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="always"
            keyboardDismissMode="none"
            automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
          >
            <View style={styles.cardModal}>
              <Pressable style={styles.botaoFechar} disabled={recuperando} onPress={fecharRecuperacao}>
                <Text style={styles.textoFechar}>×</Text>
              </Pressable>

              <Text style={styles.tituloModal}>Recuperar senha</Text>

              <Text style={styles.descricaoModal}>Informe seu e-mail para receber o link de redefinição de senha.</Text>

              <Text style={styles.label}>E-mail</Text>

              <TextInput
                style={styles.inputModal}
                placeholder="usuario@gmail.com"
                placeholderTextColor="#94a3b8"
                value={emailRecuperacao}
                onChangeText={setEmailRecuperacao}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!recuperando}
              />

              {!!mensagemRecuperacao && (
                <View style={styles.caixaRecuperacao}>
                  <Text style={styles.textoRecuperacao}>✓ {mensagemRecuperacao}</Text>
                </View>
              )}

              <Pressable
                disabled={recuperando}
                onPress={recuperarSenha}
                style={({ pressed }) => [styles.botaoEnviar, (pressed || recuperando) && styles.botaoEnviarPressionado]}
              >
                <Text style={styles.textoBotao}>{recuperando ? "Enviando..." : "Enviar e-mail"}</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // Fundo principal
  container: {
    flex: 1,
  },

  // Ajusta a tela à abertura do teclado
  areaTeclado: {
    flex: 1,
  },

  // Permite a rolagem com o teclado aberto
  rolagemPrincipal: {
    flex: 1,
    width: "100%",
  },

  conteudoPrincipal: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 22,
    paddingVertical: 30,
  },

  // Card principal
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 28,

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },

  logo: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 14,
  },

  titulo: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#0f172a",
    textAlign: "center",
  },

  subtitulo: {
    fontSize: 15,
    color: "#64748b",
    textAlign: "center",
    marginTop: 5,
    marginBottom: 30,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 8,
  },

  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    color: "#0f172a",
    backgroundColor: "#ffffff",
    marginBottom: 18,
  },

  campoSenha: {
    height: 50,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },

  inputSenha: {
    flex: 1,
    height: "100%",
    paddingHorizontal: 15,
    fontSize: 16,
    color: "#0f172a",
  },

  botaoOlho: {
    height: "100%",
    width: 50,
    alignItems: "center",
    justifyContent: "center",
  },

  informacoes: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 22,
    gap: 8,
  },

  textoSecundario: {
    fontSize: 13,
    color: "#64748b",
  },

  esqueciSenha: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2563eb",
  },

  botaoEntrar: {
    height: 52,
    borderRadius: 12,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
  },

  botaoEntrarPressionado: {
    backgroundColor: "#1e40af",
    opacity: 0.85,
  },

  textoBotao: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ffffff",
  },

  caixaEntrando: {
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
    borderRadius: 10,
    padding: 10,
    marginTop: 14,
  },

  textoEntrando: {
    color: "#1d4ed8",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },

  caixaLoginSucesso: {
    backgroundColor: "#dcfce7",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: 10,
    padding: 10,
    marginTop: 14,
  },

  textoLoginSucesso: {
    color: "#166534",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },

  rodape: {
    marginTop: 20,
    fontSize: 12,
    color: "#94a3b8",
    textAlign: "center",
  },

  // Fundo do modal de recuperação
  fundoModal: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
  },

  rolagemModal: {
    flex: 1,
    width: "100%",
  },

  conteudoRolagemModal: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
    paddingVertical: 30,
  },

  cardModal: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 26,

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },

  botaoFechar: {
    position: "absolute",
    right: 15,
    top: 10,
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },

  textoFechar: {
    fontSize: 30,
    color: "#64748b",
  },

  tituloModal: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0f172a",
    textAlign: "center",
    marginBottom: 8,
  },

  descricaoModal: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },

  inputModal: {
    height: 50,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    color: "#0f172a",
    backgroundColor: "#ffffff",
    marginBottom: 18,
  },

  caixaRecuperacao: {
    backgroundColor: "#dcfce7",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },

  textoRecuperacao: {
    color: "#166534",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 19,
  },

  botaoEnviar: {
    height: 52,
    borderRadius: 12,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
  },

  botaoEnviarPressionado: {
    backgroundColor: "#1e40af",
    opacity: 0.85,
  },
});
