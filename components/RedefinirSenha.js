import { useEffect, useRef, useState } from "react";

import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
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

export default function RedefinirSenha({ usuario, concluir, voltarLogin }) {
  // Campos da nova senha
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  // Mostrar ou ocultar senhas
  const [mostrarNova, setMostrarNova] = useState(false);
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);

  // Controle do salvamento
  const [salvando, setSalvando] = useState(false);

  // Mensagem de confirmação dentro do card
  const [sucesso, setSucesso] = useState(false);

  // Guarda o tempo de espera antes de entrar no sistema
  const temporizador = useRef(null);

  // Cancela o temporizador ao sair da tela
  useEffect(() => {
    return () => {
      if (temporizador.current) {
        clearTimeout(temporizador.current);
      }
    };
  }, []);

  async function alterarSenha() {
    if (salvando || sucesso) {
      return;
    }

    // Verifica os campos
    if (!novaSenha || !confirmarSenha) {
      Alert.alert("Erro", "Preencha todos os campos.");
      return;
    }

    // Valida o tamanho da senha
    if (novaSenha.length < 6) {
      Alert.alert("Erro", "A nova senha deve possuir pelo menos 6 caracteres.");
      return;
    }

    // Confere as duas senhas
    if (novaSenha !== confirmarSenha) {
      Alert.alert("Erro", "A confirmação da nova senha não corresponde.");
      return;
    }

    // Verifica se o usuário possui um token
    if (!usuario?.token) {
      Alert.alert("Sessão inválida", "Faça o login novamente.", [
        {
          text: "OK",
          onPress: voltarLogin,
        },
      ]);
      return;
    }

    setSalvando(true);

    try {
      // Solicita a alteração da senha ao backend
      const resposta = await fetch(`${API_URL}/usuarios/primeiro-acesso/senha`, {
        method: "PUT",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${usuario.token}`,
        },

        body: JSON.stringify({
          novaSenha: novaSenha,
        }),
      });

      // Sessão inválida ou expirada
      if (resposta.status === 401) {
        Alert.alert("Sessão expirada", "Faça o login novamente.", [
          {
            text: "OK",
            onPress: voltarLogin,
          },
        ]);
        return;
      }

      // Outros erros retornados pelo backend
      if (!resposta.ok) {
        let mensagem = "Não foi possível cadastrar a nova senha.";

        if (resposta.status === 400) {
          mensagem = "A senha deve possuir pelo menos 6 caracteres e ser diferente da senha inicial.";
        }

        if (resposta.status === 403) {
          mensagem = "Não foi possível concluir o primeiro acesso. Faça o login novamente.";
        }

        Alert.alert("Erro", mensagem);
        return;
      }

      // A senha foi salva corretamente
      Keyboard.dismiss();

      // Atualiza as informações do usuário
      const usuarioAtualizado = {
        ...usuario,
        primeiroAcesso: false,
      };

      // Mostra a confirmação dentro do próprio card
      setSucesso(true);

      // Aguarda a mensagem e entra automaticamente
      temporizador.current = setTimeout(() => {
        concluir(usuarioAtualizado);
      }, 1500);
    } catch (erro) {
      console.log("Erro ao alterar senha:", erro);

      Alert.alert("Erro", "Não foi possível conectar ao servidor.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <LinearGradient colors={["#0f172a", "#1e3a8a", "#1d4ed8"]} style={styles.container}>
      {/* Ajusta a tela quando o teclado abre */}
      <KeyboardAvoidingView style={styles.areaTeclado} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView
          style={styles.rolagem}
          contentContainerStyle={styles.conteudo}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none"
          automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
        >
          <View style={styles.card}>
            {/* Logo do sistema */}
            <LinearGradient colors={["#2563eb", "#38bdf8"]} style={styles.logo}>
              <BlocksIcon width={38} height={38} color="#ffffff" />
            </LinearGradient>

            {/* Título */}
            <Text style={styles.titulo}>Primeiro acesso</Text>

            <Text style={styles.subtitulo}>Para continuar, cadastre uma nova senha.</Text>

            {/* Nova senha */}
            <Text style={styles.label}>Nova senha</Text>

            <View style={styles.campoSenha}>
              <TextInput
                style={styles.inputSenha}
                placeholder="Digite a nova senha"
                placeholderTextColor="#94a3b8"
                value={novaSenha}
                onChangeText={setNovaSenha}
                secureTextEntry={!mostrarNova}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!salvando && !sucesso}
              />

              <Pressable
                style={styles.botaoOlho}
                disabled={salvando || sucesso}
                onPress={() => setMostrarNova(!mostrarNova)}
              >
                {mostrarNova ? (
                  <EyeOffIcon width={22} height={22} color="#64748b" />
                ) : (
                  <EyeIcon width={22} height={22} color="#64748b" />
                )}
              </Pressable>
            </View>

            {/* Confirmação da nova senha */}
            <Text style={styles.label}>Confirmar nova senha</Text>

            <View style={styles.campoSenha}>
              <TextInput
                style={styles.inputSenha}
                placeholder="Digite novamente a nova senha"
                placeholderTextColor="#94a3b8"
                value={confirmarSenha}
                onChangeText={setConfirmarSenha}
                secureTextEntry={!mostrarConfirmacao}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!salvando && !sucesso}
              />

              <Pressable
                style={styles.botaoOlho}
                disabled={salvando || sucesso}
                onPress={() => setMostrarConfirmacao(!mostrarConfirmacao)}
              >
                {mostrarConfirmacao ? (
                  <EyeOffIcon width={22} height={22} color="#64748b" />
                ) : (
                  <EyeIcon width={22} height={22} color="#64748b" />
                )}
              </Pressable>
            </View>

            {/* Aviso sobre tamanho da senha */}
            <Text style={styles.aviso}>A nova senha deve possuir pelo menos 6 caracteres.</Text>

            {/* Botão de cadastro */}
            <Pressable
              disabled={salvando || sucesso}
              onPress={alterarSenha}
              style={({ pressed }) => [
                styles.botaoSalvar,
                (pressed || salvando || sucesso) && styles.botaoSalvarPressionado,
              ]}
            >
              <Text style={styles.textoBotao}>
                {sucesso ? "Senha cadastrada" : salvando ? "Salvando..." : "Cadastrar nova senha"}
              </Text>
            </Pressable>

            {/* Confirmação dentro do card */}
            {sucesso && (
              <View style={styles.mensagemSucesso}>
                <Text style={styles.textoSucesso}>✓ Senha cadastrada com sucesso!</Text>

                <Text style={styles.textoEntrando}>Entrando no SIA...</Text>
              </View>
            )}

            {/* Rodapé */}
            <Text style={styles.rodape}>Sistema de Almoxarifado</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  // Fundo da tela
  container: {
    flex: 1,
  },

  // Ajuste do teclado
  areaTeclado: {
    flex: 1,
  },

  // Rolagem da tela
  rolagem: {
    flex: 1,
    width: "100%",
  },

  conteudo: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 22,
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

  // Logo
  logo: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 14,
  },

  // Título
  titulo: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#0f172a",
    textAlign: "center",
  },

  // Subtítulo
  subtitulo: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    marginTop: 6,
    marginBottom: 28,
  },

  // Rótulos dos campos
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 8,
  },

  // Campos de senha
  campoSenha: {
    height: 50,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },

  inputSenha: {
    flex: 1,
    height: "100%",
    paddingHorizontal: 15,
    fontSize: 16,
    color: "#0f172a",
  },

  // Botão mostrar ou ocultar senha
  botaoOlho: {
    height: "100%",
    width: 50,
    alignItems: "center",
    justifyContent: "center",
  },

  // Aviso
  aviso: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 20,
  },

  // Botão salvar
  botaoSalvar: {
    height: 52,
    borderRadius: 12,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
  },

  botaoSalvarPressionado: {
    backgroundColor: "#1e40af",
  },

  textoBotao: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ffffff",
  },

  // Mensagem de confirmação no próprio card
  mensagemSucesso: {
    marginTop: 14,
    alignItems: "center",
  },

  textoSucesso: {
    fontSize: 14,
    fontWeight: "600",
    color: "#16a34a",
    textAlign: "center",
  },

  textoEntrando: {
    fontSize: 12,
    color: "#64748b",
    textAlign: "center",
    marginTop: 5,
  },

  // Rodapé
  rodape: {
    marginTop: 20,
    fontSize: 12,
    color: "#94a3b8",
    textAlign: "center",
  },
});
