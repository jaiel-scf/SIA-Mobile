import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import BlocksIcon from "../assets/icons/blocks.svg";
import BotaoTema from "./BotaoTema";
import CartaoBoasVindas from "./CartaoBoasVindas";
import IndicadoresDashboard from "./IndicadoresDashboard";
import { API_URL } from "../config/api";

export default function Inicio({ usuario, voltarParaLogin, escuro, alternarTema }) {
  const [menuAberto, setMenuAberto] = useState(false);
  const [preferencias, setPreferencias] = useState(false);
  const [meuPerfilAberto, setMeuPerfilAberto] = useState(false);
  const [nomeAtual, setNomeAtual] = useState(usuario?.nome || "Usuário");
  const [nomeEditado, setNomeEditado] = useState(nomeAtual);
  const [salvando, setSalvando] = useState(false);
  const [senhaAberta, setSenhaAberta] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [alterandoSenha, setAlterandoSenha] = useState(false);
  const [mensagem, setMensagem] = useState(null);
  const notificar = (titulo, descricao) => setMensagem({ titulo, descricao });

  async function salvarPerfil() {
    const nome = nomeEditado.trim();
    if (nome.length < 3 || nome.length > 120) {
      notificar("Nome inválido", "Informe um nome entre 3 e 120 caracteres.");
      return;
    }
    if (!usuario?.token) {
      notificar("Sessão expirada", "Faça login novamente.");
      return;
    }
    if (nome === nomeAtual) {
      setMeuPerfilAberto(false);
      return;
    }
    setSalvando(true);
    try {
      const resposta = await fetch(`${API_URL}/usuarios/meu-perfil`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${usuario.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nome }),
      });
      if (!resposta.ok) {
        throw new Error(resposta.status === 404
          ? "A atualização de perfil ainda não está disponível no servidor."
          : "Não foi possível atualizar seu perfil.");
      }
      const atualizado = await resposta.json();
      const nomeSalvo = atualizado.nome || nome;
      setNomeAtual(nomeSalvo);
      usuario.nome = nomeSalvo;
      setMeuPerfilAberto(false);
      notificar("Perfil atualizado", "Seu nome foi salvo com sucesso.");
    } catch (erro) {
      notificar("Erro", erro.message);
    } finally {
      setSalvando(false);
    }
  }
  const administrador = String(usuario?.perfil ?? "").toLowerCase() === "admin";
  const perfil = administrador ? "Administrador" : "Usuário";

  const cores = {
    fundo: escuro ? "#0B1220" : "#F4F7FC",
    card: escuro ? "#17233A" : "#FFFFFF",
    texto: escuro ? "#F8FAFC" : "#0F172A",
    secundario: escuro ? "#A9B9D0" : "#64748B",
    borda: escuro ? "#2B3B54" : "#E7EDF5",
  };

  async function salvarSenha() {
    if (!senhaAtual || novaSenha.length < 6) {
      notificar("Dados inválidos", "Informe a senha atual e uma nova senha com pelo menos 6 caracteres.");
      return;
    }
    if (novaSenha !== confirmarSenha) {
      notificar("Confirmação inválida", "As novas senhas não coincidem.");
      return;
    }
    if (senhaAtual === novaSenha) {
      notificar("Senha inválida", "A nova senha deve ser diferente da atual.");
      return;
    }
    if (!usuario?.token) {
      notificar("Sessão expirada", "Faça login novamente.");
      return;
    }
    setAlterandoSenha(true);
    try {
      const resposta = await fetch(`${API_URL}/usuarios/me/senha`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${usuario.token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ senhaAtual, novaSenha }),
      });
      if (!resposta.ok) {
        const mensagens = {
          400: "Senha atual incorreta ou nova senha inválida.",
          401: "Sessão expirada. Faça login novamente.",
          403: "Acesso não permitido.",
        };
        throw new Error(mensagens[resposta.status] || "Não foi possível alterar a senha.");
      }
      setSenhaAberta(false);
      setSenhaAtual("");
      setNovaSenha("");
      setConfirmarSenha("");
      notificar("Senha alterada", "Sua senha foi atualizada com sucesso.");
    } catch (erro) {
      notificar("Erro", erro.message);
    } finally {
      setAlterandoSenha(false);
    }
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

        <CartaoBoasVindas nome={nomeAtual} perfil={perfil} />

        <Text style={[styles.secao, { color: cores.texto }]}>Dashboard</Text>
        <IndicadoresDashboard usuario={usuario} escuro={escuro} />

      </ScrollView>

      <Modal transparent visible={menuAberto} animationType="fade" onRequestClose={() => setMenuAberto(false)}>
        <Pressable style={styles.sobreposicao} onPress={() => setMenuAberto(false)}>
          <View style={[styles.menuConta, { backgroundColor: cores.card }]}>
            <Text style={[styles.menuCabecalho, { color: cores.secundario }]}>MINHA CONTA</Text>
            <Text style={[styles.menuNome, { color: cores.texto }]}>{nomeAtual}</Text>
            <Text style={[styles.menuPerfil, { color: cores.secundario }]}>{perfil}</Text>
            <Pressable style={styles.linha} onPress={() => { setMenuAberto(false); setNomeEditado(nomeAtual); setMeuPerfilAberto(true); }}>
              <Text style={[styles.opcao, { color: cores.texto }]}>👤   Meu perfil</Text>
            </Pressable>
            <Pressable style={styles.linha} onPress={() => { setMenuAberto(false); setSenhaAberta(true); }}>
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

      <Modal transparent visible={meuPerfilAberto} animationType="fade" onRequestClose={() => !salvando && setMeuPerfilAberto(false)}>
        <View style={styles.sobreposicao}>
          <View style={[styles.preferencias, { backgroundColor: cores.card }]}>
            <Text style={[styles.secao, { color: cores.texto }]}>Meu perfil</Text>
            <Text style={[styles.campoRotulo, { color: cores.secundario }]}>Nome completo</Text>
            <TextInput
              style={[styles.campoPerfil, { color: cores.texto, borderColor: cores.borda }]}
              value={nomeEditado}
              onChangeText={setNomeEditado}
              maxLength={120}
              editable={!salvando}
              autoCapitalize="words"
            />
            <Text style={[styles.campoRotulo, { color: cores.secundario }]}>E-mail</Text>
            <Text style={[styles.campoSomenteLeitura, { color: cores.texto, backgroundColor: cores.fundo }]}>
              {usuario?.email || "Não informado"}
            </Text>
            <Text style={[styles.campoRotulo, { color: cores.secundario }]}>Perfil de acesso</Text>
            <Text style={[styles.campoSomenteLeitura, { color: cores.texto, backgroundColor: cores.fundo }]}>{perfil}</Text>
            <Pressable disabled={salvando} style={styles.salvarPerfil} onPress={salvarPerfil}>
              <Text style={styles.salvarPerfilTexto}>{salvando ? "Salvando..." : "Salvar alterações"}</Text>
            </Pressable>
            <Pressable disabled={salvando} style={styles.fechar} onPress={() => setMeuPerfilAberto(false)}>
              <Text style={styles.fecharTexto}>Cancelar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={senhaAberta} animationType="fade" onRequestClose={() => !alterandoSenha && setSenhaAberta(false)}>
        <View style={styles.sobreposicao}>
          <View style={[styles.preferencias, { backgroundColor: cores.card }]}>
            <Text style={[styles.secao, { color: cores.texto }]}>Alterar senha</Text>
            {[
              ["Senha atual", senhaAtual, setSenhaAtual],
              ["Nova senha (mínimo 6 caracteres)", novaSenha, setNovaSenha],
              ["Confirmar nova senha", confirmarSenha, setConfirmarSenha],
            ].map(([rotulo, valor, alterar]) => (
              <View key={rotulo}>
                <Text style={[styles.campoRotulo, { color: cores.secundario }]}>{rotulo}</Text>
                <TextInput style={[styles.campoPerfil, { color: cores.texto, borderColor: cores.borda }]}
                  value={valor} onChangeText={alterar} secureTextEntry editable={!alterandoSenha}
                  autoCapitalize="none" />
              </View>
            ))}
            <Pressable disabled={alterandoSenha} style={styles.salvarPerfil} onPress={salvarSenha}>
              <Text style={styles.salvarPerfilTexto}>{alterandoSenha ? "Salvando..." : "Alterar senha"}</Text>
            </Pressable>
            <Pressable disabled={alterandoSenha} style={styles.fechar} onPress={() => {
              setSenhaAberta(false); setSenhaAtual(""); setNovaSenha(""); setConfirmarSenha("");
            }}>
              <Text style={styles.fecharTexto}>Cancelar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={!!mensagem} animationType="fade" onRequestClose={() => setMensagem(null)}>
        <View style={styles.sobreposicao}>
          <View style={[styles.preferencias, { backgroundColor: cores.card }]}>
            <Text style={[styles.secao, { color: cores.texto }]}>{mensagem?.titulo}</Text>
            <Text style={[styles.descricao, { color: cores.secundario }]}>{mensagem?.descricao}</Text>
            <Pressable style={styles.fechar} onPress={() => setMensagem(null)}>
              <Text style={styles.fecharTexto}>Entendi</Text>
            </Pressable>
          </View>
        </View>
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
  campoRotulo: { fontSize: 12, fontWeight: "700", marginTop: 12, marginBottom: 6 },
  campoPerfil: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 15 },
  campoSomenteLeitura: { borderRadius: 12, padding: 13, fontSize: 14 },
  salvarPerfil: { backgroundColor: "#2563EB", padding: 14, borderRadius: 12, alignItems: "center", marginTop: 22 },
  salvarPerfilTexto: { color: "#FFFFFF", fontWeight: "700" },
});
