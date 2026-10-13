import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Keyboard,
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
import SendIcon from "../assets/icons/send.svg";

const REQUISICOES_POR_PAGINA = 3;

const nomesMeses = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const diasSemana = ["D", "S", "T", "Q", "Q", "S", "S"];

const situacoes = {
  AGUARDANDO: {
    texto: "Aguardando",
    cor: "#92400e",
    fundo: "#fef3c7",
  },
  AUTORIZADO: {
    texto: "Autorizado",
    cor: "#166534",
    fundo: "#dcfce7",
  },
  REPROVADO: {
    texto: "Reprovado",
    cor: "#b91c1c",
    fundo: "#fee2e2",
  },
  FINALIZADO: {
    texto: "Finalizado",
    cor: "#1d4ed8",
    fundo: "#dbeafe",
  },
};

function formatarData(data) {
  if (!data) return "-";

  const valor = new Date(data);

  if (Number.isNaN(valor.getTime())) return "-";

  return valor.toLocaleString("pt-BR");
}

function pegarSomenteData(data) {
  if (!data) return "";

  const valor = new Date(data);

  if (Number.isNaN(valor.getTime())) return "";

  const ano = valor.getFullYear();
  const mes = String(valor.getMonth() + 1).padStart(2, "0");
  const dia = String(valor.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function mostrarDataCurta(data) {
  if (!data) return "Selecionar data";

  const [ano, mes, dia] = data.split("-");

  return `${dia}/${mes}/${ano}`;
}

function criarData(ano, mes, dia) {
  return `${ano}-${String(mes + 1).padStart(2, "0")}-` + String(dia).padStart(2, "0");
}

// Calendário dos filtros
function Calendario({ visivel, valor, fechar, selecionar }) {
  const dataInicial = valor ? new Date(`${valor}T12:00:00`) : new Date();

  const [mesAtual, setMesAtual] = useState(new Date(dataInicial.getFullYear(), dataInicial.getMonth(), 1));

  function mudarMes(diferenca) {
    setMesAtual((anterior) => {
      return new Date(anterior.getFullYear(), anterior.getMonth() + diferenca, 1);
    });
  }

  function escolherDia(dia) {
    selecionar(criarData(mesAtual.getFullYear(), mesAtual.getMonth(), dia));

    fechar();
  }

  const ano = mesAtual.getFullYear();
  const mes = mesAtual.getMonth();

  const primeiroDia = new Date(ano, mes, 1).getDay();
  const totalDias = new Date(ano, mes + 1, 0).getDate();

  const dias = [...Array(primeiroDia).fill(null), ...Array.from({ length: totalDias }, (_, indice) => indice + 1)];

  while (dias.length % 7 !== 0) {
    dias.push(null);
  }

  return (
    <Modal visible={visivel} transparent animationType="fade" onRequestClose={fechar}>
      <View style={styles.fundoModal}>
        <View style={styles.cardCalendario}>
          <View style={styles.cabecalhoCalendario}>
            <Pressable style={styles.setaCalendario} onPress={() => mudarMes(-1)}>
              <Text style={styles.textoSetaCalendario}>‹</Text>
            </Pressable>

            <Text style={styles.tituloCalendario}>
              {nomesMeses[mes]} {ano}
            </Text>

            <Pressable style={styles.setaCalendario} onPress={() => mudarMes(1)}>
              <Text style={styles.textoSetaCalendario}>›</Text>
            </Pressable>
          </View>

          <View style={styles.gradeCalendario}>
            {diasSemana.map((dia, indice) => (
              <View key={`semana-${indice}`} style={styles.celulaCalendario}>
                <Text style={styles.diaSemana}>{dia}</Text>
              </View>
            ))}

            {dias.map((dia, indice) => {
              const dataDia = dia ? criarData(ano, mes, dia) : "";

              const selecionado = dataDia === valor;

              return (
                <View key={`dia-${indice}`} style={styles.celulaCalendario}>
                  {dia !== null && (
                    <Pressable
                      style={[styles.botaoDia, selecionado && styles.diaSelecionado]}
                      onPress={() => escolherDia(dia)}
                    >
                      <Text style={[styles.textoDia, selecionado && styles.textoDiaSelecionado]}>{dia}</Text>
                    </Pressable>
                  )}
                </View>
              );
            })}
          </View>

          <View style={styles.acoesCalendario}>
            <Pressable
              onPress={() => {
                selecionar("");
                fechar();
              }}
            >
              <Text style={styles.limparCalendario}>Limpar data</Text>
            </Pressable>

            <Pressable onPress={fechar}>
              <Text style={styles.fecharCalendario}>Fechar</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function Saidas({ usuario, voltar }) {
  const formularioScrollRef = useRef(null);
  const observacaoRef = useRef(null);

  const token = usuario?.token;
  const usuarioId = usuario?.id;
  const usuarioNome = usuario?.nome || "Usuário";

  const administrador = String(usuario?.perfil ?? "").toLowerCase() === "admin";

  const [produtos, setProdutos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [requisicoes, setRequisicoes] = useState([]);

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagemSucesso, setMensagemSucesso] = useState("");

  // Formulário da nova requisição
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState("");
  const [mostrarProdutos, setMostrarProdutos] = useState(false);
  const [quantidade, setQuantidade] = useState("");
  const [observacao, setObservacao] = useState("");

  // Filtros
  const [filtroCodigo, setFiltroCodigo] = useState("");
  const [filtroUsuario, setFiltroUsuario] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroDataCriacao, setFiltroDataCriacao] = useState("");
  const [filtroDataAtualizada, setFiltroDataAtualizada] = useState("");

  const [mostrarStatus, setMostrarStatus] = useState(false);
  const [calendarioAberto, setCalendarioAberto] = useState("");

  // Detalhes e paginação
  const [requisicaoSelecionada, setRequisicaoSelecionada] = useState(null);
  const [paginaAtual, setPaginaAtual] = useState(1);

  // Carrega produtos, requisições e usuários
  const carregarDados = useCallback(async () => {
    setCarregando(true);
    setErro("");

    if (!token) {
      setErro("Sessão sem autenticação. Faça login novamente.");
      setCarregando(false);
      return;
    }

    try {
      const cabecalhos = {
        Authorization: `Bearer ${token}`,
      };

      const buscas = [
        fetch(`${API_URL}/produtos/listar`, {
          headers: cabecalhos,
        }),
        fetch(`${API_URL}/movimentacoes/requisicoes`, {
          headers: cabecalhos,
        }),
      ];

      if (administrador) {
        buscas.push(
          fetch(`${API_URL}/usuarios/listar`, {
            headers: cabecalhos,
          }),
        );
      }

      const respostas = await Promise.all(buscas);

      if (respostas.some((resposta) => resposta.status === 401)) {
        throw new Error("Sua sessão expirou. Faça login novamente.");
      }

      if (!respostas[0].ok) {
        throw new Error("Não foi possível carregar os produtos.");
      }

      if (!respostas[1].ok) {
        throw new Error("Não foi possível carregar as requisições.");
      }

      const produtosRecebidos = await respostas[0].json();
      const requisicoesRecebidas = await respostas[1].json();

      if (!Array.isArray(produtosRecebidos) || !Array.isArray(requisicoesRecebidas)) {
        throw new Error("O servidor retornou dados em formato inesperado.");
      }

      produtosRecebidos.sort((a, b) =>
        String(a.nome ?? "").localeCompare(String(b.nome ?? ""), "pt-BR", { sensitivity: "base" }),
      );

      // Requisições mais recentes primeiro
      requisicoesRecebidas.sort((a, b) => {
        const dataA = new Date(a.dataMovimentacao || 0).getTime();
        const dataB = new Date(b.dataMovimentacao || 0).getTime();

        if (dataB !== dataA) {
          return dataB - dataA;
        }

        return Number(b.id || 0) - Number(a.id || 0);
      });

      setProdutos(produtosRecebidos);
      setRequisicoes(requisicoesRecebidas);

      if (administrador && respostas[2]?.ok) {
        const usuariosRecebidos = await respostas[2].json();

        if (Array.isArray(usuariosRecebidos)) {
          setUsuarios(usuariosRecebidos);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar requisições:", error);

      setErro(error.message === "Network request failed" ? "Não foi possível conectar ao servidor." : error.message);
    } finally {
      setCarregando(false);
    }
  }, [token, administrador]);

  useFocusEffect(
    useCallback(() => {
      carregarDados();
    }, [carregarDados]),
  );

  function buscarNomeProduto(id) {
    const produto = produtos.find((item) => String(item.id) === String(id));

    return produto?.nome || "Produto não encontrado";
  }

  function buscarNomeUsuario(id) {
    if (String(id) === String(usuarioId)) {
      return usuarioNome;
    }

    const encontrado = usuarios.find((item) => String(item.id) === String(id));

    return encontrado?.nome || `Usuário ${id ?? "-"}`;
  }

  // Abre o formulário em primeiro plano
  function abrirFormulario() {
    setMensagemSucesso("");
    setMostrarProdutos(false);
    setMostrarFormulario(true);
  }

  function limparFormulario() {
    setProdutoSelecionado("");
    setMostrarProdutos(false);
    setQuantidade("");
    setObservacao("");
  }

  // Fecha o formulário sem alterar os filtros ou a página
  function fecharFormulario() {
    if (salvando) return;

    Keyboard.dismiss();
    setMostrarFormulario(false);
    limparFormulario();
  }

  // Desloca a observação para cima do teclado
  
function ajustarObservacao() {
  setTimeout(() => {
    formularioScrollRef.current?.scrollToEnd({
      animated: true,
    });
  }, 350);
}

  // Envia a nova requisição ao backend
  async function salvarRequisicao() {
    if (salvando) return;

    setMensagemSucesso("");

    const quantidadeNumero = Number(quantidade);

    if (
      !produtoSelecionado ||
      quantidade.trim() === "" ||
      !Number.isSafeInteger(quantidadeNumero) ||
      quantidadeNumero <= 0
    ) {
      Alert.alert("Erro", "Selecione um material e informe uma quantidade inteira maior que zero.");
      return;
    }

    const produto = produtos.find((item) => String(item.id) === String(produtoSelecionado));

    if (!produto) {
      Alert.alert("Erro", "O material selecionado não foi encontrado.");
      return;
    }

    setSalvando(true);

    try {
      const resposta = await fetch(`${API_URL}/movimentacoes/requisicoes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          produtoId: Number(produtoSelecionado),
          quantidade: quantidadeNumero,
          observacao: observacao.trim(),
        }),
      });

      if (resposta.status === 401) {
        throw new Error("Sua sessão expirou. Faça login novamente.");
      }

      if (resposta.status === 403) {
        throw new Error("Você não tem permissão para criar requisições.");
      }

      if (!resposta.ok) {
        throw new Error("Não foi possível enviar a requisição.");
      }

      Keyboard.dismiss();
      limparFormulario();
      setMostrarFormulario(false);
      setPaginaAtual(1);
      setMensagemSucesso("Requisição enviada com sucesso!");

      await carregarDados();
    } catch (error) {
      console.error("Erro ao enviar requisição:", error);

      Alert.alert(
        "Erro",
        error.message === "Network request failed" ? "Não foi possível conectar ao servidor." : error.message,
      );
    } finally {
      setSalvando(false);
    }
  }

  // Abre detalhes em um card centralizado
  function abrirDetalhes(requisicao) {
    setRequisicaoSelecionada(requisicao);
  }

  function fecharDetalhes() {
    if (atualizando) return;

    setRequisicaoSelecionada(null);
  }

  // Administrador altera o status
  async function alterarStatus(novoStatus) {
    if (!administrador || !requisicaoSelecionada || atualizando) {
      return;
    }

    setAtualizando(true);
    setMensagemSucesso("");

    try {
      const resposta = await fetch(`${API_URL}/movimentacoes/requisicoes/${requisicaoSelecionada.id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: novoStatus,
        }),
      });

      if (resposta.status === 401) {
        throw new Error("Sua sessão expirou. Faça login novamente.");
      }

      if (resposta.status === 403) {
        throw new Error("Apenas administradores podem alterar o status.");
      }

      if (!resposta.ok) {
        throw new Error("Não foi possível alterar o status da requisição.");
      }

      setRequisicaoSelecionada(null);
      setMensagemSucesso("Status atualizado com sucesso!");

      await carregarDados();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);

      Alert.alert("Erro", error.message);
    } finally {
      setAtualizando(false);
    }
  }

  function limparFiltros() {
    setFiltroCodigo("");
    setFiltroUsuario("");
    setFiltroDataCriacao("");
    setFiltroStatus("");
    setFiltroDataAtualizada("");
    setMostrarStatus(false);
    setPaginaAtual(1);
  }

  // Filtra antes de calcular as páginas
  const requisicoesFiltradas = requisicoes.filter((requisicao) => {
    const codigo = String(requisicao.codigo ?? "").toLowerCase();

    const nome = buscarNomeUsuario(requisicao.usuarioId).toLowerCase();

    if (filtroCodigo.trim() && !codigo.includes(filtroCodigo.trim().toLowerCase())) {
      return false;
    }

    if (filtroUsuario.trim() && !nome.includes(filtroUsuario.trim().toLowerCase())) {
      return false;
    }

    if (filtroStatus && requisicao.status !== filtroStatus) {
      return false;
    }

    if (filtroDataCriacao && pegarSomenteData(requisicao.dataMovimentacao) !== filtroDataCriacao) {
      return false;
    }

    if (filtroDataAtualizada && pegarSomenteData(requisicao.dataAtualizada) !== filtroDataAtualizada) {
      return false;
    }

    return true;
  });

  const totalPaginas = Math.ceil(requisicoesFiltradas.length / REQUISICOES_POR_PAGINA);

  const paginaSegura = Math.min(paginaAtual, Math.max(1, totalPaginas));

  const primeiroIndice = (paginaSegura - 1) * REQUISICOES_POR_PAGINA;

  const requisicoesDaPagina = requisicoesFiltradas.slice(primeiroIndice, primeiroIndice + REQUISICOES_POR_PAGINA);

  useEffect(() => {
    setPaginaAtual(1);
  }, [filtroCodigo, filtroUsuario, filtroStatus, filtroDataCriacao, filtroDataAtualizada]);

  function mudarPagina(novaPagina) {
    if (novaPagina < 1 || novaPagina > totalPaginas || novaPagina === paginaSegura) {
      return;
    }

    setPaginaAtual(novaPagina);
  }

  // Mantém poucos números visíveis em telas pequenas
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

  const produtoAtual = produtos.find((item) => String(item.id) === String(produtoSelecionado));

  const statusSelecionado = requisicaoSelecionada?.status || "AGUARDANDO";

  const statusDetalhe = situacoes[statusSelecionado] || {
    texto: statusSelecionado,
    cor: "#475569",
    fundo: "#e2e8f0",
  };

  return (
    <View style={styles.container}>
      {/* Cabeçalho */}
      <View style={styles.cabecalho}>
        <Pressable style={styles.botaoVoltar} onPress={voltar}>
          <Text style={styles.textoVoltar}>‹</Text>
        </Pressable>

        <View style={styles.caixaIcone}>
          <SendIcon width={27} height={27} color="#ffffff" />
        </View>

        <View style={styles.areaTitulo}>
          <Text style={styles.titulo}>Requisições</Text>

          <Text style={styles.subtitulo}>Consultar e solicitar materiais</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.areaTeclado}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.conteudo}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
        >
          {/* Abre o formulário sobre a tela */}
          <Pressable style={styles.botaoNovo} onPress={abrirFormulario}>
            <Text style={styles.textoBotaoNovo}>+ Nova requisição</Text>
          </Pressable>

          {!!mensagemSucesso && (
            <View style={styles.caixaSucesso}>
              <Text style={styles.textoSucesso}>✓ {mensagemSucesso}</Text>
            </View>
          )}

          {carregando && <Text style={styles.aviso}>Carregando requisições...</Text>}

          {!!erro && (
            <View style={styles.caixaErro}>
              <Text style={styles.textoErro}>{erro}</Text>

              <Pressable onPress={carregarDados}>
                <Text style={styles.textoTentar}>Tentar novamente</Text>
              </Pressable>
            </View>
          )}

          {/* Filtros */}
          <View style={styles.card}>
            <Text style={styles.cardTitulo}>Filtros</Text>

            <Text style={styles.label}>Código</Text>

            <TextInput
              style={styles.input}
              placeholder="Código da requisição"
              placeholderTextColor="#94a3b8"
              value={filtroCodigo}
              onChangeText={setFiltroCodigo}
            />

            <Text style={styles.label}>Criado por</Text>

            <TextInput
              style={styles.input}
              placeholder="Nome do usuário"
              placeholderTextColor="#94a3b8"
              value={filtroUsuario}
              onChangeText={setFiltroUsuario}
            />

            <Text style={styles.label}>Data de criação</Text>

            <Pressable style={styles.campoData} onPress={() => setCalendarioAberto("criacao")}>
              <Text style={[styles.textoCampoData, !filtroDataCriacao && styles.placeholder]}>
                {mostrarDataCurta(filtroDataCriacao)}
              </Text>

              <Text style={styles.iconeCalendario}>▦</Text>
            </Pressable>

            <Text style={styles.label}>Status</Text>

            <Pressable style={styles.seletor} onPress={() => setMostrarStatus(!mostrarStatus)}>
              <Text style={[styles.textoSelecionado, !filtroStatus && styles.placeholder]}>
                {filtroStatus ? situacoes[filtroStatus]?.texto : "Todos"}
              </Text>

              <Text style={styles.setaSeletor}>{mostrarStatus ? "▲" : "▼"}</Text>
            </Pressable>

            {mostrarStatus && (
              <View style={styles.listaStatus}>
                {[
                  { valor: "", texto: "Todos" },
                  { valor: "AGUARDANDO", texto: "Aguardando" },
                  { valor: "AUTORIZADO", texto: "Autorizado" },
                  { valor: "REPROVADO", texto: "Reprovado" },
                  { valor: "FINALIZADO", texto: "Finalizado" },
                ].map((item) => (
                  <Pressable
                    key={item.valor || "todos"}
                    style={styles.produtoOpcao}
                    onPress={() => {
                      setFiltroStatus(item.valor);
                      setMostrarStatus(false);
                    }}
                  >
                    <Text style={styles.produtoOpcaoTexto}>{item.texto}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            <Text style={styles.label}>Data atualizada</Text>

            <Pressable style={styles.campoData} onPress={() => setCalendarioAberto("atualizada")}>
              <Text style={[styles.textoCampoData, !filtroDataAtualizada && styles.placeholder]}>
                {mostrarDataCurta(filtroDataAtualizada)}
              </Text>

              <Text style={styles.iconeCalendario}>▦</Text>
            </Pressable>

            <Pressable style={styles.botaoLimparFiltros} onPress={limparFiltros}>
              <Text style={styles.textoLimparFiltros}>Limpar filtros</Text>
            </Pressable>
          </View>

          {/* Lista de requisições */}
          <View style={styles.card}>
            <Text style={styles.cardTitulo}>Requisições</Text>

            {!carregando && !erro && requisicoesFiltradas.length === 0 && (
              <Text style={styles.semResultado}>Nenhuma requisição encontrada.</Text>
            )}

            {!carregando &&
              !erro &&
              requisicoesDaPagina.map((requisicao) => {
                const situacao = situacoes[requisicao.status] || situacoes.AGUARDANDO;

                return (
                  <Pressable
                    key={requisicao.id}
                    style={styles.requisicaoItem}
                    onPress={() => abrirDetalhes(requisicao)}
                  >
                    <View style={styles.linhaRequisicao}>
                      <Text style={styles.codigoRequisicao}>{requisicao.codigo || `#${requisicao.id}`}</Text>

                      <View style={[styles.status, { backgroundColor: situacao.fundo }]}>
                        <Text style={[styles.textoStatus, { color: situacao.cor }]}>{situacao.texto}</Text>
                      </View>
                    </View>

                    <Text style={styles.dadoRequisicao}>Criado por: {buscarNomeUsuario(requisicao.usuarioId)}</Text>

                    <Text style={styles.dadoRequisicao}>Criação: {formatarData(requisicao.dataMovimentacao)}</Text>

                    <Text style={styles.dadoRequisicao}>Atualizada: {formatarData(requisicao.dataAtualizada)}</Text>

                    <Text style={styles.textoExibir}>Ver detalhes ›</Text>
                  </Pressable>
                );
              })}

            {/* Paginação */}
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
      </KeyboardAvoidingView>

      {/* Modal de nova requisição */}
      <Modal
        visible={mostrarFormulario}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={fecharFormulario}
      >
        <KeyboardAvoidingView
          style={styles.fundoDetalhes}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={0}
        >
          <View style={styles.cardModalFormulario}>
            <View style={styles.cabecalhoDetalhes}>
              <View style={styles.areaTituloDetalhes}>
                <Text style={styles.tituloDetalhes}>Nova requisição</Text>

                <Text style={styles.subtituloDetalhes}>Informe os dados do material solicitado</Text>
              </View>

              <Pressable style={styles.botaoFecharDetalhes} disabled={salvando} onPress={fecharFormulario}>
                <Text style={styles.textoFecharDetalhes}>×</Text>
              </Pressable>
            </View>

            <ScrollView
              ref={formularioScrollRef}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.conteudoModalFormulario}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
            >
              <Text style={styles.label}>Material</Text>

              <Pressable
                style={styles.seletor}
                disabled={salvando || carregando || !!erro}
                onPress={() => setMostrarProdutos(!mostrarProdutos)}
              >
                <Text style={[styles.textoSelecionado, !produtoAtual && styles.placeholder]} numberOfLines={1}>
                  {produtoAtual
                    ? `${produtoAtual.nome} - Disponível: ${produtoAtual.quantidade ?? 0}`
                    : "Selecionar material"}
                </Text>

                <Text style={styles.setaSeletor}>{mostrarProdutos ? "▲" : "▼"}</Text>
              </Pressable>

              {mostrarProdutos && (
                <View style={styles.listaProdutos}>
                  {produtos.length === 0 && <Text style={styles.semResultado}>Nenhum material encontrado.</Text>}

                  {produtos.map((produto) => (
                    <Pressable
                      key={produto.id}
                      style={styles.produtoOpcao}
                      onPress={() => {
                        setProdutoSelecionado(String(produto.id));
                        setMostrarProdutos(false);
                      }}
                    >
                      <Text style={styles.produtoOpcaoTexto}>{produto.nome}</Text>

                      <Text style={styles.produtoCodigo}>Código: {produto.codigo || "-"}</Text>

                      <Text style={styles.produtoCodigo}>Disponível: {produto.quantidade ?? 0}</Text>
                    </Pressable>
                  ))}
                </View>
              )}

              <Text style={styles.label}>Quantidade</Text>

              <TextInput
                style={styles.input}
                placeholder="Digite a quantidade"
                placeholderTextColor="#94a3b8"
                value={quantidade}
                onChangeText={setQuantidade}
                keyboardType="number-pad"
                editable={!salvando}
              />

              <Text style={styles.label}>Observação</Text>

              <TextInput
                ref={observacaoRef}
                style={styles.inputObservacao}
                placeholder="Motivo ou observação da requisição"
                placeholderTextColor="#94a3b8"
                value={observacao}
                onChangeText={setObservacao}
                onFocus={ajustarObservacao}
                multiline
                textAlignVertical="top"
                editable={!salvando}
              />

              <View style={styles.areaBotoes}>
                <Pressable
                  style={[styles.botaoSalvar, (salvando || carregando || !!erro) && styles.botaoDesabilitado]}
                  disabled={salvando || carregando || !!erro}
                  onPress={salvarRequisicao}
                >
                  <Text style={styles.textoBotaoSalvar}>{salvando ? "Enviando..." : "Enviar requisição"}</Text>
                </Pressable>

                <Pressable style={styles.botaoLimpar} disabled={salvando} onPress={fecharFormulario}>
                  <Text style={styles.textoBotaoLimpar}>Cancelar</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal de detalhes */}
      <Modal
        visible={requisicaoSelecionada !== null}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={fecharDetalhes}
      >
        <View style={styles.fundoDetalhes}>
          <View style={styles.cardModalDetalhes}>
            <View style={styles.cabecalhoDetalhes}>
              <View style={styles.areaTituloDetalhes}>
                <Text style={styles.tituloDetalhes}>Detalhes da requisição</Text>

                <Text style={styles.subtituloDetalhes}>Consulte as informações do pedido</Text>
              </View>

              <Pressable style={styles.botaoFecharDetalhes} disabled={atualizando} onPress={fecharDetalhes}>
                <Text style={styles.textoFecharDetalhes}>×</Text>
              </Pressable>
            </View>

            {requisicaoSelecionada && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.conteudoModalDetalhes}>
                <Text style={styles.labelDetalhe}>Código</Text>

                <Text style={styles.valorDetalhe}>
                  {requisicaoSelecionada.codigo || `#${requisicaoSelecionada.id}`}
                </Text>

                <Text style={styles.labelDetalhe}>Criado por</Text>

                <Text style={styles.valorDetalhe}>{buscarNomeUsuario(requisicaoSelecionada.usuarioId)}</Text>

                <Text style={styles.labelDetalhe}>Produto</Text>

                <Text style={styles.valorDetalhe}>{buscarNomeProduto(requisicaoSelecionada.produtoId)}</Text>

                <Text style={styles.labelDetalhe}>Quantidade</Text>

                <Text style={styles.valorDetalhe}>{requisicaoSelecionada.quantidade}</Text>

                <Text style={styles.labelDetalhe}>Status</Text>

                <View style={[styles.statusDetalhe, { backgroundColor: statusDetalhe.fundo }]}>
                  <Text style={[styles.textoStatus, { color: statusDetalhe.cor }]}>{statusDetalhe.texto}</Text>
                </View>

                <Text style={styles.labelDetalhe}>Data de criação</Text>

                <Text style={styles.valorDetalhe}>{formatarData(requisicaoSelecionada.dataMovimentacao)}</Text>

                <Text style={styles.labelDetalhe}>Data atualizada</Text>

                <Text style={styles.valorDetalhe}>{formatarData(requisicaoSelecionada.dataAtualizada)}</Text>

                <Text style={styles.labelDetalhe}>Observação</Text>

                <Text style={styles.valorDetalhe}>{requisicaoSelecionada.observacao || "Sem observação"}</Text>

                {administrador && statusSelecionado === "AGUARDANDO" && (
                  <View style={styles.areaAcoesAdmin}>
                    <Pressable
                      style={[styles.botaoAutorizar, atualizando && styles.botaoDesabilitado]}
                      disabled={atualizando}
                      onPress={() => alterarStatus("AUTORIZADO")}
                    >
                      <Text style={styles.textoAcaoAdmin}>{atualizando ? "Atualizando..." : "Autorizar"}</Text>
                    </Pressable>

                    <Pressable
                      style={[styles.botaoReprovar, atualizando && styles.botaoDesabilitado]}
                      disabled={atualizando}
                      onPress={() => alterarStatus("REPROVADO")}
                    >
                      <Text style={styles.textoAcaoAdmin}>Reprovar</Text>
                    </Pressable>
                  </View>
                )}

                {administrador && statusSelecionado === "AUTORIZADO" && (
                  <View style={styles.areaAcoesAdmin}>
                    <Pressable
                      style={[styles.botaoFinalizar, atualizando && styles.botaoDesabilitado]}
                      disabled={atualizando}
                      onPress={() => alterarStatus("FINALIZADO")}
                    >
                      <Text style={styles.textoAcaoAdmin}>{atualizando ? "Atualizando..." : "Finalizar"}</Text>
                    </Pressable>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Calendário dos filtros */}
      {calendarioAberto !== "" && (
        <Calendario
          key={calendarioAberto}
          visivel
          valor={calendarioAberto === "criacao" ? filtroDataCriacao : filtroDataAtualizada}
          fechar={() => setCalendarioAberto("")}
          selecionar={(data) => {
            if (calendarioAberto === "criacao") {
              setFiltroDataCriacao(data);
            } else {
              setFiltroDataAtualizada(data);
            }
          }}
        />
      )}
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
    color: "#c2410c",
    marginTop: -3,
  },

  caixaIcone: {
    width: 45,
    height: 45,
    borderRadius: 13,
    backgroundColor: "#f97316",
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

  areaTeclado: {
    flex: 1,
  },

  conteudo: {
    paddingBottom: 90,
    flexGrow: 1,
  },

  botaoNovo: {
    backgroundColor: "#f97316",
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
    marginBottom: 20,
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
    backgroundColor: "#ffffff",
    marginBottom: 18,
  },

  inputObservacao: {
    minHeight: 95,
    maxHeight: 150,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: "#0f172a",
    backgroundColor: "#ffffff",
    textAlignVertical: "top",
    marginBottom: 20,
  },

  seletor: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    backgroundColor: "#ffffff",
  },

  textoSelecionado: {
    flex: 1,
    fontSize: 15,
    color: "#0f172a",
    marginRight: 10,
  },

  placeholder: {
    color: "#94a3b8",
  },

  setaSeletor: {
    fontSize: 12,
    color: "#64748b",
  },

  listaProdutos: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    marginBottom: 18,
    overflow: "hidden",
    maxHeight: 300,
  },

  listaStatus: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    marginBottom: 18,
    overflow: "hidden",
  },

  produtoOpcao: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },

  produtoOpcaoTexto: {
    fontSize: 15,
    color: "#334155",
    fontWeight: "600",
  },

  produtoCodigo: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 4,
  },

  areaBotoes: {
    flexDirection: "row",
    gap: 10,
  },

  botaoSalvar: {
    flex: 1,
    minHeight: 50,
    backgroundColor: "#f97316",
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
    paddingHorizontal: 15,
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

  aviso: {
    textAlign: "center",
    color: "#64748b",
    marginBottom: 18,
  },

  caixaErro: {
    backgroundColor: "#fee2e2",
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
    gap: 10,
  },

  textoErro: {
    color: "#b91c1c",
    fontSize: 14,
  },

  textoTentar: {
    color: "#c2410c",
    fontWeight: "600",
  },

  campoData: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: "#ffffff",
    marginBottom: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  textoCampoData: {
    fontSize: 15,
    color: "#334155",
  },

  iconeCalendario: {
    fontSize: 23,
    color: "#ea580c",
  },

  botaoLimparFiltros: {
    alignSelf: "flex-start",
    paddingVertical: 5,
  },

  textoLimparFiltros: {
    color: "#c2410c",
    fontWeight: "600",
    fontSize: 14,
  },

  semResultado: {
    fontSize: 14,
    color: "#94a3b8",
    paddingVertical: 10,
  },

  requisicaoItem: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    backgroundColor: "#ffffff",
  },

  linhaRequisicao: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },

  codigoRequisicao: {
    flex: 1,
    fontSize: 15,
    fontWeight: "bold",
    color: "#0f172a",
  },

  status: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },

  textoStatus: {
    fontSize: 12,
    fontWeight: "bold",
  },

  dadoRequisicao: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 5,
  },

  textoExibir: {
    fontSize: 13,
    color: "#c2410c",
    fontWeight: "600",
    marginTop: 8,
  },

  areaPaginacao: {
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 18,
    marginTop: 8,
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
    backgroundColor: "#f97316",
    borderColor: "#f97316",
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

  // Fundo compartilhado pelos dois cards em primeiro plano
  fundoDetalhes: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 45,
  },

  cardModalDetalhes: {
    width: "100%",
    maxHeight: "90%",
    backgroundColor: "#ffffff",
    borderRadius: 20,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },

  // Card da nova requisição
  cardModalFormulario: {
    width: "100%",
    maxHeight: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 20,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },

  cabecalhoDetalhes: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },

  areaTituloDetalhes: {
    flex: 1,
    paddingRight: 12,
  },

  tituloDetalhes: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#0f172a",
  },

  subtituloDetalhes: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 5,
  },

  botaoFecharDetalhes: {
    width: 35,
    height: 35,
    borderRadius: 10,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },

  textoFecharDetalhes: {
    fontSize: 26,
    color: "#475569",
    marginTop: -3,
  },

  conteudoModalFormulario: {
    padding: 20,
    paddingBottom: 35,
  },

  conteudoModalDetalhes: {
    padding: 20,
    paddingBottom: 28,
  },

  labelDetalhe: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "600",
    marginBottom: 4,
  },

  valorDetalhe: {
    fontSize: 15,
    color: "#0f172a",
    marginBottom: 18,
  },

  statusDetalhe: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    marginBottom: 18,
  },

  areaAcoesAdmin: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 8,
  },

  botaoAutorizar: {
    backgroundColor: "#16a34a",
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 13,
  },

  botaoReprovar: {
    backgroundColor: "#dc2626",
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 13,
  },

  botaoFinalizar: {
    backgroundColor: "#2563eb",
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 13,
  },

  textoAcaoAdmin: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 14,
  },

  // Calendário
  fundoModal: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 20,
  },

  cardCalendario: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 18,
  },

  cabecalhoCalendario: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },

  setaCalendario: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#fff7ed",
    justifyContent: "center",
    alignItems: "center",
  },

  textoSetaCalendario: {
    fontSize: 28,
    color: "#c2410c",
    marginTop: -3,
  },

  tituloCalendario: {
    fontSize: 17,
    color: "#0f172a",
    fontWeight: "bold",
  },

  gradeCalendario: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  celulaCalendario: {
    width: "14.2857%",
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },

  diaSemana: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "bold",
  },

  botaoDia: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  diaSelecionado: {
    backgroundColor: "#f97316",
  },

  textoDia: {
    fontSize: 14,
    color: "#334155",
  },

  textoDiaSelecionado: {
    color: "#ffffff",
    fontWeight: "bold",
  },

  acoesCalendario: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 6,
    marginTop: 20,
  },

  limparCalendario: {
    color: "#64748b",
    fontWeight: "600",
  },

  fecharCalendario: {
    color: "#c2410c",
    fontWeight: "bold",
  },
});
