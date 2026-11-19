import { useEffect, useRef, useState } from "react";

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
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const [modalRecuperacao, setModalRecuperacao] = useState(false);
  const [emailRecuperacao, setEmailRecuperacao] = useState("");
  const [mensagemRecuperacao, setMensagemRecuperacao] = useState("");

  const [mensagemLogin, setMensagemLogin] = useState("");
  const [entrando, setEntrando] = useState(false);
  const [loginConfirmado, setLoginConfirmado] = useState(false);
  const temporizadorLogin = useRef(null);
  useEffect(() => () => clearTimeout(temporizadorLogin.current), []);
  const [recuperando, setRecuperando] = useState(false);

  function abrirRecuperacao() {
    Keyboard.dismiss();

    setMensagemRecuperacao("");
    setMensagemLogin("");
    setEmailRecuperacao(email.trim());
    setModalRecuperacao(true);
  }

  function fecharRecuperacao() {
    if (recuperando) return;

    Keyboard.dismiss();

    setModalRecuperacao(false);
    setMensagemRecuperacao("");
  }

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

      const textoResposta = await resposta.text();

      let dados = {};

      if (textoResposta) {
        try {
          dados = JSON.parse(textoResposta);
        } catch (error) {
          // Utiliza a mensagem padrão quando a resposta não é JSON.
        }
      }

      setMensagemRecuperacao(
        dados.mensagem ||
          "Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha.",
      );

      Keyboard.dismiss();
    } catch (erro) {
      console.error("Erro na recuperação de senha:", erro);

      Alert.alert(
        "Erro",
        erro.message === "Network request failed"
          ? "Não foi possível conectar ao servidor."
          : erro.message,
      );
    } finally {
      setRecuperando(false);
    }
  }

  async function fazerLogin() {
    if (entrando) return;

    setMensagemRecuperacao("");
    setMensagemLogin("");
    setLoginConfirmado(false);

    const emailLimpo = email.trim().toLowerCase();

    if (!emailLimpo || !senha) {
      Alert.alert("Erro", "Preencha o e-mail e a senha.");
      return;
    }

    setEntrando(true);
    let autenticado = false;

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
        setMensagemLogin("E-mail ou senha incorretos.");
        return;
      }

      if (!resposta.ok) {
        throw new Error("Não foi possível realizar o login.");
      }

      const dadosUsuario = await resposta.json();

      if (!dadosUsuario || !dadosUsuario.token) {
        throw new Error("O servidor não retornou uma sessão válida.");
      }

      Keyboard.dismiss();
      autenticado = true;
      setLoginConfirmado(true);
      setMensagemLogin(dadosUsuario.primeiroAcesso === true
        ? "Primeiro acesso confirmado. Redefina sua senha."
        : "Login realizado com sucesso!");
      temporizadorLogin.current = setTimeout(() => entrar(dadosUsuario), 900);
    } catch (erro) {
      console.error("Erro ao fazer login:", erro);

      setMensagemLogin(
        erro.message === "Network request failed" || erro.message === "Failed to fetch"
          ? "Não foi possível conectar ao servidor."
          : erro.message,
      );
    } finally {
      if (!autenticado) setEntrando(false);
    }
  }

  return (
    <>
      <LinearGradient
        colors={["#0f172a", "#1e40af", "#0369a1"]}
        style={styles.container}
      >
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
            <View style={styles.card}>
              <LinearGradient
                colors={["#2563eb", "#38bdf8"]}
                style={styles.logo}
              >
                <BlocksIcon width={36} height={36} color="#ffffff" />
              </LinearGradient>

              <Text style={styles.titulo}>SIA</Text>

              <Text style={styles.subtitulo}>Sistema de Almoxarifado</Text>

              <Text style={styles.descricao}>
                Acesse sua conta para continuar
              </Text>

              <Text style={styles.label}>E-mail</Text>

              <View style={styles.campo}>
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
              </View>

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

                <Pressable
                  style={styles.botaoOlho}
                  onPress={() => setMostrarSenha(!mostrarSenha)}
                >
                  {mostrarSenha ? (
                    <EyeOffIcon width={21} height={21} color="#64748b" />
                  ) : (
                    <EyeIcon width={21} height={21} color="#64748b" />
                  )}
                </Pressable>
              </View>

              <View style={styles.informacoes}>
                <Text style={styles.textoSecundario}>Acesso ao sistema</Text>

                <Pressable onPress={abrirRecuperacao}>
                  <Text style={styles.esqueciSenha}>Esqueci a senha</Text>
                </Pressable>
              </View>

              <Pressable
                disabled={entrando}
                onPress={fazerLogin}
                style={({ pressed }) => [
                  styles.botaoEntrar,
                  (pressed || entrando) && styles.botaoEntrarPressionado,
                ]}
              >
                <Text style={styles.textoBotao}>
                  {loginConfirmado ? "Login confirmado" : entrando ? "Entrando..." : "Entrar"}
                </Text>
              </Pressable>

              {entrando && !loginConfirmado && (
                <View style={styles.caixaEntrando}>
                  <Text style={styles.textoEntrando}>
                    Verificando seus dados...
                  </Text>
                </View>
              )}

              {!!mensagemLogin && (
                <View style={loginConfirmado ? styles.caixaLoginSucesso : styles.caixaLoginErro}>
                  <Text style={loginConfirmado ? styles.textoLoginSucesso : styles.textoLoginErro}>{mensagemLogin}</Text>
                </View>
              )}

              <Text style={styles.rodape}>
                Acesso ao Sistema de Almoxarifado
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>

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
              <Pressable
                style={styles.botaoFechar}
                disabled={recuperando}
                onPress={fecharRecuperacao}
              >
                <Text style={styles.textoFechar}>×</Text>
              </Pressable>

              <Text style={styles.tituloModal}>Recuperar senha</Text>

              <Text style={styles.descricaoModal}>
                Informe seu e-mail para receber o link de redefinição de senha.
              </Text>

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
                  <Text style={styles.textoRecuperacao}>
                    ✓ {mensagemRecuperacao}
                  </Text>
                </View>
              )}

              <Pressable
                disabled={recuperando}
                onPress={recuperarSenha}
                style={({ pressed }) => [
                  styles.botaoEnviar,
                  (pressed || recuperando) && styles.botaoEnviarPressionado,
                ]}
              >
                <Text style={styles.textoBotao}>
                  {recuperando ? "Enviando..." : "Enviar e-mail"}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  areaTeclado: {
    flex: 1,
  },

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

  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#f8fafc",
    borderRadius: 16,
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
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 14,
  },

  titulo: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1e40af",
    textAlign: "center",
  },

  subtitulo: {
    fontSize: 15,
    fontWeight: "500",
    color: "#334155",
    textAlign: "center",
    marginTop: 5,
  },

  descricao: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 28,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 8,
  },

  campo: {
    height: 50,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    backgroundColor: "#ffffff",
    marginBottom: 18,
  },

  input: {
    flex: 1,
    paddingHorizontal: 15,
    fontSize: 15,
    color: "#0f172a",
  },

  campoSenha: {
    height: 50,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },

  inputSenha: {
    flex: 1,
    height: "100%",
    paddingHorizontal: 15,
    fontSize: 15,
    color: "#0f172a",
  },

  botaoOlho: {
    height: "100%",
    width: 48,
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
    height: 50,
    borderRadius: 8,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
  },

  botaoEntrarPressionado: {
    backgroundColor: "#1d4ed8",
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
    borderRadius: 8,
    padding: 10,
    marginTop: 14,
  },

  textoEntrando: {
    color: "#1d4ed8",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },

  caixaLoginSucesso: { backgroundColor: "#dcfce7", borderWidth: 1, borderColor: "#bbf7d0", borderRadius: 8, padding: 10, marginTop: 14 },
  textoLoginSucesso: { color: "#166534", fontSize: 13, fontWeight: "600", textAlign: "center" },
  caixaLoginErro: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 8,
    padding: 10,
    marginTop: 14,
  },

  textoLoginErro: {
    color: "#b91c1c",
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
    backgroundColor: "#f8fafc",
    borderRadius: 16,
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
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 15,
    color: "#0f172a",
    backgroundColor: "#ffffff",
    marginBottom: 18,
  },

  caixaRecuperacao: {
    backgroundColor: "#dcfce7",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: 8,
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
    height: 50,
    borderRadius: 8,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
  },

  botaoEnviarPressionado: {
    backgroundColor: "#1d4ed8",
    opacity: 0.85,
  },
});
