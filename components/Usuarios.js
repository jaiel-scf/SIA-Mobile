import { useCallback, useEffect, useState } from "react";
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

import { useFocusEffect } from "@react-navigation/native";
import { API_URL } from "../config/api";

import UserPlusIcon from "../assets/icons/user-plus.svg";
import EyeIcon from "../assets/icons/eye.svg";
import EyeOffIcon from "../assets/icons/eye-off.svg";

const USUARIOS_POR_PAGINA = 3;

export default function Usuarios({ usuario, voltar }) {
  const token = usuario?.token;
  const administrador = String(usuario?.perfil ?? "").toLowerCase() === "admin";

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [perfil, setPerfil] = useState("Usuário");

  const [usuarios, setUsuarios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagemSucesso, setMensagemSucesso] = useState("");

  const [mostrarCadastro, setMostrarCadastro] = useState(false);
  const [usuarioParaExcluir, setUsuarioParaExcluir] = useState(null);

  const [paginaAtual, setPaginaAtual] = useState(1);

  // Busca os usuários no backend
  const carregarUsuarios = useCallback(async () => {
    setCarregando(true);
    setErro("");

    if (!administrador) {
      setErro("Apenas administradores podem acessar esta tela.");
      setCarregando(false);
      return;
    }

    if (!token) {
      setErro("Sessão inválida. Faça login novamente.");
      setCarregando(false);
      return;
    }

    try {
      const resposta = await fetch(`${API_URL}/usuarios/listar`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (resposta.status === 401) {
        throw new Error("Sua sessão expirou. Faça login novamente.");
      }

      if (resposta.status === 403) {
        throw new Error("Você não possui permissão para visualizar usuários.");
      }

      if (!resposta.ok) {
        throw new Error(`Não foi possível carregar os usuários. Erro ${resposta.status}.`);
      }

      const dados = await resposta.json();

      if (!Array.isArray(dados)) {
        throw new Error("O servidor retornou uma lista de usuários inválida.");
      }

      const usuariosAtivos = dados.filter((item) => item.ativo !== false);

      usuariosAtivos.sort((a, b) =>
        String(a.nome ?? "").localeCompare(String(b.nome ?? ""), "pt-BR", { sensitivity: "base" }),
      );

      setUsuarios(usuariosAtivos);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);

      setErro(
        error.message === "Network request failed"
          ? "Não foi possível conectar ao backend. Verifique se o servidor está ligado e se o celular está na mesma rede."
          : error.message || "Erro ao carregar usuários.",
      );
    } finally {
      setCarregando(false);
    }
  }, [token, administrador]);

  useFocusEffect(
    useCallback(() => {
      carregarUsuarios();
    }, [carregarUsuarios]),
  );

  // Limpa os dados digitados
  function limparCampos() {
    setNome("");
    setEmail("");
    setSenha("");
    setMostrarSenha(false);
    setPerfil("Usuário");
  }

  function abrirCadastro() {
    setMensagemSucesso("");
    limparCampos();
    setMostrarCadastro(true);
  }

  function fecharCadastro() {
    if (salvando) return;

    Keyboard.dismiss();
    setMostrarCadastro(false);
    limparCampos();
  }

  // Cadastra o usuário
  async function salvarUsuario() {
    if (!administrador || salvando) return;

    const nomeLimpo = nome.trim();
    const emailLimpo = email.trim().toLowerCase();

    if (!nomeLimpo || !emailLimpo || !senha) {
      Alert.alert("Campos obrigatórios", "Preencha o nome, o e-mail e a senha inicial.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpo)) {
      Alert.alert("E-mail inválido", "Digite um endereço de e-mail válido.");
      return;
    }

    const perfilBackend = perfil === "Administrador" ? "admin" : "usuario";

    setSalvando(true);

    try {
      const resposta = await fetch(`${API_URL}/usuarios/registrar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nome: nomeLimpo,
          email: emailLimpo,
          senha,
          perfil: perfilBackend,
        }),
      });

      if (resposta.status === 401) {
        throw new Error("Sua sessão expirou. Faça login novamente.");
      }

      if (resposta.status === 403) {
        throw new Error("Apenas administradores podem cadastrar usuários.");
      }

      if (resposta.status === 409) {
        throw new Error("Já existe um usuário ativo com esse e-mail.");
      }

      if (!resposta.ok) {
        throw new Error(`Não foi possível cadastrar o usuário. Erro ${resposta.status}.`);
      }

      Keyboard.dismiss();
      setMostrarCadastro(false);
      limparCampos();
      setPaginaAtual(1);
      setMensagemSucesso("Usuário cadastrado com sucesso!");

      await carregarUsuarios();
    } catch (error) {
      console.error("Erro ao cadastrar usuário:", error);

      Alert.alert(
        "Erro",
        error.message === "Network request failed" ? "Não foi possível conectar ao servidor." : error.message,
      );
    } finally {
      setSalvando(false);
    }
  }

  function mostrarPerfil(perfilUsuario) {
    return String(perfilUsuario).toLowerCase() === "admin" ? "Administrador" : "Usuário";
  }

  function excluirUsuario(usuarioCadastrado) {
    if (!administrador) return;

    if (String(usuarioCadastrado.id) === String(usuario?.id)) {
      Alert.alert("Atenção", "Você não pode excluir o usuário que está logado.");
      return;
    }

    setUsuarioParaExcluir(usuarioCadastrado);
  }

  // Exclui usuário, preservando o histórico
  async function confirmarExclusao() {
    if (!administrador || !usuarioParaExcluir || excluindo) {
      return;
    }

    setExcluindo(true);
    setMensagemSucesso("");

    try {
      const resposta = await fetch(`${API_URL}/usuarios/${usuarioParaExcluir.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (resposta.status === 401) {
        throw new Error("Sua sessão expirou. Faça login novamente.");
      }

      if (resposta.status === 403) {
        throw new Error("Você não possui permissão para excluir usuários.");
      }

      if (!resposta.ok) {
        throw new Error(`Não foi possível excluir o usuário. Erro ${resposta.status}.`);
      }

      setUsuarioParaExcluir(null);
      setMensagemSucesso("Usuário excluído com sucesso!");

      await carregarUsuarios();
    } catch (error) {
      console.error("Erro ao excluir usuário:", error);

      Alert.alert(
        "Erro",
        error.message === "Network request failed" ? "Não foi possível conectar ao servidor." : error.message,
      );
    } finally {
      setExcluindo(false);
    }
  }

  // Paginação
  const totalPaginas = Math.ceil(usuarios.length / USUARIOS_POR_PAGINA);

  const paginaSegura = Math.min(paginaAtual, Math.max(1, totalPaginas));

  const primeiroIndice = (paginaSegura - 1) * USUARIOS_POR_PAGINA;

  const usuariosDaPagina = usuarios.slice(primeiroIndice, primeiroIndice + USUARIOS_POR_PAGINA);

  useEffect(() => {
    if (paginaAtual > Math.max(1, totalPaginas)) {
      setPaginaAtual(Math.max(1, totalPaginas));
    }
  }, [paginaAtual, totalPaginas]);

  function mudarPagina(novaPagina) {
    if (novaPagina < 1 || novaPagina > totalPaginas || novaPagina === paginaSegura) {
      return;
    }

    setPaginaAtual(novaPagina);
  }

  function gerarNumerosPaginas() {
    if (totalPaginas <= 5) {
      return Array.from({ length: totalPaginas }, (_, indice) => indice + 1);
    }

    const inicio = Math.max(2, Math.min(paginaSegura - 1, totalPaginas - 3));

    const fim = Math.min(totalPaginas - 1, inicio + 2);

    const paginas = [1];

    if (inicio > 2) {
      paginas.push("inicio-pontos");
    }

    for (let pagina = inicio; pagina <= fim; pagina++) {
      paginas.push(pagina);
    }

    if (fim < totalPaginas - 1) {
      paginas.push("fim-pontos");
    }

    paginas.push(totalPaginas);

    return paginas;
  }

  return (
    <View style={styles.container}>
      {/* Cabeçalho */}
      <View style={styles.cabecalho}>
        <Pressable style={styles.botaoVoltar} onPress={voltar}>
          <Text style={styles.textoVoltar}>‹</Text>
        </Pressable>

        <View style={styles.caixaIcone}>
          <UserPlusIcon width={27} height={27} color="#ffffff" />
        </View>

        <View style={styles.areaTitulo}>
          <Text style={styles.titulo}>Usuários</Text>
          <Text style={styles.subtitulo}>Cadastro e gerenciamento</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.conteudo}
        keyboardShouldPersistTaps="handled"
      >
        {administrador && (
          <Pressable style={styles.botaoNovo} onPress={abrirCadastro}>
            <Text style={styles.textoBotaoNovo}>+ Novo usuário</Text>
          </Pressable>
        )}

        {!!mensagemSucesso && (
          <View style={styles.caixaSucesso}>
            <Text style={styles.textoSucesso}>✓ {mensagemSucesso}</Text>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitulo}>Usuários cadastrados</Text>

          <Text style={styles.cardSubtitulo}>Usuários ativos com acesso ao sistema.</Text>

          {carregando && <Text style={styles.semUsuario}>Carregando usuários cadastrados...</Text>}

          {!carregando && !!erro && (
            <View style={styles.caixaErro}>
              <Text style={styles.textoErro}>{erro}</Text>

              <Pressable onPress={carregarUsuarios}>
                <Text style={styles.tentarNovamente}>Tentar novamente</Text>
              </Pressable>
            </View>
          )}

          {!carregando && !erro && usuarios.length === 0 && (
            <Text style={styles.semUsuario}>Nenhum usuário ativo encontrado.</Text>
          )}

          {!carregando &&
            !erro &&
            usuariosDaPagina.map((usuarioCadastrado) => {
              const perfilAdmin = String(usuarioCadastrado.perfil ?? "").toLowerCase() === "admin";

              const usuarioAtual = String(usuarioCadastrado.id) === String(usuario?.id);

              return (
                <View key={usuarioCadastrado.id} style={styles.usuarioItem}>
                  <View style={styles.dadosUsuario}>
                    <Text style={styles.usuarioNome}>{usuarioCadastrado.nome}</Text>

                    <Text style={styles.usuarioEmail}>{usuarioCadastrado.email}</Text>

                    <View style={styles.areaInformacoes}>
                      <View style={[styles.perfilUsuario, perfilAdmin && styles.perfilAdministrador]}>
                        <Text style={[styles.perfilUsuarioTexto, perfilAdmin && styles.perfilAdministradorTexto]}>
                          {mostrarPerfil(usuarioCadastrado.perfil)}
                        </Text>
                      </View>

                      <View style={styles.statusAtivo}>
                        <View style={styles.bolinhaAtivo} />
                        <Text style={styles.textoAtivo}>Ativo</Text>
                      </View>
                    </View>
                  </View>

                  {usuarioAtual ? (
                    <Text style={styles.usuarioAtual}>Usuário atual</Text>
                  ) : (
                    <Pressable style={styles.botaoExcluir} onPress={() => excluirUsuario(usuarioCadastrado)}>
                      <Text style={styles.textoExcluir}>Excluir</Text>
                    </Pressable>
                  )}
                </View>
              );
            })}

          {!carregando && !erro && totalPaginas > 1 && (
            <View style={styles.areaPaginacao}>
              <Text style={styles.textoPaginacao}>
                Página {paginaSegura} de {totalPaginas}
              </Text>

              <View style={styles.botoesPaginacao}>
                <Pressable
                  style={[styles.botaoPagina, paginaSegura === 1 && styles.botaoPaginaDesabilitado]}
                  disabled={paginaSegura === 1}
                  onPress={() => mudarPagina(paginaSegura - 1)}
                >
                  <Text style={styles.textoPagina}>‹</Text>
                </Pressable>

                {gerarNumerosPaginas().map((pagina) => {
                  if (typeof pagina === "string") {
                    return (
                      <Text key={pagina} style={styles.pontosPagina}>
                        ...
                      </Text>
                    );
                  }

                  const ativa = pagina === paginaSegura;

                  return (
                    <Pressable
                      key={`pagina-${pagina}`}
                      style={[styles.botaoPagina, ativa && styles.paginaAtiva]}
                      onPress={() => mudarPagina(pagina)}
                    >
                      <Text style={[styles.textoPagina, ativa && styles.textoPaginaAtiva]}>{pagina}</Text>
                    </Pressable>
                  );
                })}

                <Pressable
                  style={[styles.botaoPagina, paginaSegura === totalPaginas && styles.botaoPaginaDesabilitado]}
                  disabled={paginaSegura === totalPaginas}
                  onPress={() => mudarPagina(paginaSegura + 1)}
                >
                  <Text style={styles.textoPagina}>›</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal para cadastrar usuário */}
      <Modal
        visible={mostrarCadastro}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={fecharCadastro}
      >
        <KeyboardAvoidingView style={styles.fundoModal} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <View style={styles.modalCadastro}>
            <View style={styles.cabecalhoModal}>
              <View style={styles.areaTituloModal}>
                <Text style={styles.tituloModal}>Novo usuário</Text>

                <Text style={styles.subtituloModal}>Informe os dados para criar um acesso.</Text>
              </View>

              <Pressable style={styles.botaoFechar} disabled={salvando} onPress={fecharCadastro}>
                <Text style={styles.textoFechar}>×</Text>
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="always"
              keyboardDismissMode="none"
              automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
              contentContainerStyle={styles.conteudoModal}
            >
              <Text style={styles.label}>Nome</Text>

              <TextInput
                style={styles.input}
                placeholder="Digite o nome"
                placeholderTextColor="#94a3b8"
                value={nome}
                onChangeText={setNome}
                editable={!salvando}
              />

              <Text style={styles.label}>E-mail</Text>

              <TextInput
                style={styles.input}
                placeholder="usuario@empresa.com"
                placeholderTextColor="#94a3b8"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!salvando}
              />

              <Text style={styles.label}>Senha inicial</Text>

              <View style={styles.campoSenha}>
                <TextInput
                  style={styles.inputSenha}
                  placeholder="Digite a senha inicial"
                  placeholderTextColor="#94a3b8"
                  value={senha}
                  onChangeText={setSenha}
                  secureTextEntry={!mostrarSenha}
                  editable={!salvando}
                />

                <Pressable style={styles.botaoOlho} onPress={() => setMostrarSenha(!mostrarSenha)}>
                  {mostrarSenha ? (
                    <EyeOffIcon width={22} height={22} color="#64748b" />
                  ) : (
                    <EyeIcon width={22} height={22} color="#64748b" />
                  )}
                </Pressable>
              </View>

              <Text style={styles.avisoSenha}>O usuário deverá alterar essa senha no primeiro acesso.</Text>

              <Text style={styles.label}>Perfil</Text>

              <View style={styles.areaPerfis}>
                <Pressable
                  style={[styles.botaoPerfil, perfil === "Usuário" && styles.botaoPerfilSelecionado]}
                  disabled={salvando}
                  onPress={() => setPerfil("Usuário")}
                >
                  <Text style={[styles.textoBotaoPerfil, perfil === "Usuário" && styles.textoPerfilSelecionado]}>
                    Usuário
                  </Text>
                </Pressable>

                <Pressable
                  style={[styles.botaoPerfil, perfil === "Administrador" && styles.botaoPerfilSelecionado]}
                  disabled={salvando}
                  onPress={() => setPerfil("Administrador")}
                >
                  <Text style={[styles.textoBotaoPerfil, perfil === "Administrador" && styles.textoPerfilSelecionado]}>
                    Administrador
                  </Text>
                </Pressable>
              </View>

              <Text style={styles.perfilEscolhido}>Perfil selecionado: {perfil}</Text>

              <View style={styles.areaBotoes}>
                <Pressable
                  style={[styles.botaoSalvar, salvando && styles.botaoDesabilitado]}
                  disabled={salvando}
                  onPress={salvarUsuario}
                >
                  <Text style={styles.textoBotaoSalvar}>{salvando ? "Cadastrando..." : "Cadastrar usuário"}</Text>
                </Pressable>

                <Pressable style={styles.botaoLimpar} disabled={salvando} onPress={limparCampos}>
                  <Text style={styles.textoBotaoLimpar}>Limpar</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Confirmação de exclusão */}
      <Modal
        visible={usuarioParaExcluir !== null}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => {
          if (!excluindo) {
            setUsuarioParaExcluir(null);
          }
        }}
      >
        <View style={styles.fundoModal}>
          <View style={styles.modalExclusao}>
            <Text style={styles.tituloModal}>Excluir usuário</Text>

            <Text style={styles.textoModal}>Tem certeza que deseja excluir {usuarioParaExcluir?.nome}?</Text>

            <View style={styles.avisoExclusao}>
              <Text style={styles.textoAvisoExclusao}>
                O usuário perderá o acesso ao sistema, mas os registros anteriores serão preservados.
              </Text>
            </View>

            <View style={styles.botoesModal}>
              <Pressable
                style={styles.botaoCancelarModal}
                disabled={excluindo}
                onPress={() => setUsuarioParaExcluir(null)}
              >
                <Text style={styles.textoCancelarModal}>Cancelar</Text>
              </Pressable>

              <Pressable
                style={[styles.botaoExcluirModal, excluindo && styles.botaoDesabilitado]}
                disabled={excluindo}
                onPress={confirmarExclusao}
              >
                <Text style={styles.textoExcluirModal}>{excluindo ? "Excluindo..." : "Excluir usuário"}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    paddingHorizontal: 20,
    paddingTop: 55,
  },

  cabecalho: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },

  botaoVoltar: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  textoVoltar: {
    fontSize: 32,
    color: "#7c3aed",
    marginTop: -3,
  },

  caixaIcone: {
    width: 45,
    height: 45,
    borderRadius: 13,
    backgroundColor: "#7c3aed",
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

  conteudo: {
    paddingBottom: 60,
  },

  botaoNovo: {
    backgroundColor: "#7c3aed",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginBottom: 18,
  },

  textoBotaoNovo: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "bold",
  },

  card: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 20,
    marginBottom: 18,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
  },

  cardTitulo: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 5,
  },

  cardSubtitulo: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 16,
  },

  semUsuario: {
    fontSize: 14,
    color: "#64748b",
    paddingVertical: 12,
  },

  usuarioItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },

  dadosUsuario: {
    flex: 1,
  },

  usuarioNome: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#334155",
  },

  usuarioEmail: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 4,
  },

  areaInformacoes: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    marginTop: 11,
  },

  perfilUsuario: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },

  perfilUsuarioTexto: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "600",
  },

  perfilAdministrador: {
    backgroundColor: "#ede9fe",
  },

  perfilAdministradorTexto: {
    color: "#7c3aed",
  },

  statusAtivo: {
    backgroundColor: "#dcfce7",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },

  bolinhaAtivo: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#16a34a",
  },

  textoAtivo: {
    fontSize: 12,
    fontWeight: "600",
    color: "#166534",
  },

  botaoExcluir: {
    alignSelf: "flex-end",
    marginTop: 7,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },

  textoExcluir: {
    fontSize: 13,
    fontWeight: "600",
    color: "#dc2626",
  },

  usuarioAtual: {
    alignSelf: "flex-end",
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 9,
  },

  caixaSucesso: {
    backgroundColor: "#dcfce7",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: 10,
    padding: 12,
    marginBottom: 18,
  },

  textoSucesso: {
    color: "#166534",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },

  caixaErro: {
    backgroundColor: "#fee2e2",
    borderRadius: 12,
    padding: 14,
    marginTop: 5,
    gap: 10,
  },

  textoErro: {
    color: "#b91c1c",
    fontSize: 14,
  },

  tentarNovamente: {
    color: "#7c3aed",
    fontWeight: "bold",
    fontSize: 14,
  },

  areaPaginacao: {
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 18,
    marginTop: 12,
  },

  textoPaginacao: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 12,
  },

  botoesPaginacao: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },

  botaoPagina: {
    minWidth: 34,
    height: 36,
    paddingHorizontal: 6,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },

  paginaAtiva: {
    backgroundColor: "#7c3aed",
    borderColor: "#7c3aed",
  },

  botaoPaginaDesabilitado: {
    opacity: 0.35,
  },

  textoPagina: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
  },

  textoPaginaAtiva: {
    color: "#ffffff",
  },

  pontosPagina: {
    color: "#94a3b8",
    paddingHorizontal: 2,
  },

  // Fundo dos modais
  fundoModal: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 45,
  },

  modalCadastro: {
    width: "100%",
    maxHeight: "100%",
    maxWidth: 450,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    overflow: "hidden",
    elevation: 8,
  },

  cabecalhoModal: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },

  areaTituloModal: {
    flex: 1,
    paddingRight: 10,
  },

  tituloModal: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 5,
  },

  subtituloModal: {
    fontSize: 12,
    color: "#64748b",
  },

  botaoFechar: {
    width: 35,
    height: 35,
    borderRadius: 10,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },

  textoFechar: {
    fontSize: 26,
    color: "#475569",
    marginTop: -3,
  },

  conteudoModal: {
    padding: 20,
    paddingBottom: 50,
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
    paddingHorizontal: 14,
    fontSize: 15,
    color: "#0f172a",
    marginBottom: 18,
  },

  campoSenha: {
    height: 50,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  inputSenha: {
    flex: 1,
    height: "100%",
    paddingHorizontal: 14,
    fontSize: 15,
    color: "#0f172a",
  },

  botaoOlho: {
    width: 50,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },

  avisoSenha: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 20,
    lineHeight: 18,
  },

  areaPerfis: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 8,
  },

  botaoPerfil: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },

  botaoPerfilSelecionado: {
    backgroundColor: "#7c3aed",
    borderColor: "#7c3aed",
  },

  textoBotaoPerfil: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
  },

  textoPerfilSelecionado: {
    color: "#ffffff",
  },

  perfilEscolhido: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 20,
  },

  areaBotoes: {
    flexDirection: "row",
    gap: 10,
  },

  botaoSalvar: {
    flex: 1,
    minHeight: 50,
    backgroundColor: "#7c3aed",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },

  botaoDesabilitado: {
    opacity: 0.55,
  },

  textoBotaoSalvar: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },

  botaoLimpar: {
    minHeight: 50,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  textoBotaoLimpar: {
    color: "#475569",
    fontSize: 14,
    fontWeight: "600",
  },

  modalExclusao: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 22,
  },

  textoModal: {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 21,
    marginBottom: 18,
  },

  avisoExclusao: {
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#fde68a",
    borderRadius: 10,
    padding: 12,
    marginBottom: 22,
  },

  textoAvisoExclusao: {
    fontSize: 13,
    color: "#92400e",
    lineHeight: 19,
  },

  botoesModal: {
    flexDirection: "row",
    justifyContent: "flex-end",
    flexWrap: "wrap",
    gap: 10,
  },

  botaoCancelarModal: {
    minHeight: 45,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  textoCancelarModal: {
    color: "#475569",
    fontSize: 14,
    fontWeight: "600",
  },

  botaoExcluirModal: {
    minHeight: 45,
    paddingHorizontal: 14,
    backgroundColor: "#dc2626",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  textoExcluirModal: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "bold",
  },
});
