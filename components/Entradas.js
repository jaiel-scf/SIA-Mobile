import { useCallback, useRef, useState } from "react";
import {
  Alert,
  Image,
  findNodeHandle,
  KeyboardAvoidingView,
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
import MiniaturaMaterial from "./MiniaturaMaterial";
import PackagePlusIcon from "../assets/icons/package-plus.svg";
import { LinearGradient } from "expo-linear-gradient";

// Unidades utilizadas no sistema
const unidades = {
  UNIDADE: "Unidade",
  CAIXA: "Caixa",
  PACOTE: "Pacote",
  METRO: "Metro",
  LITRO: "Litro",
  QUILO: "Quilo",
};

// Gera o código SKU
function gerarCodigoProduto() {
  const agora = new Date();

  const ano = String(agora.getFullYear()).slice(-2);
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");

  const caracteres = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let identificador = "";

  for (let i = 0; i < 4; i++) {
    const posicao = Math.floor(Math.random() * caracteres.length);

    identificador += caracteres[posicao];
  }

  return `P${ano}${mes}${dia}.${identificador}`;
}

// Valida uma quantidade inteira e positiva
function quantidadeValida(valor) {
  const numero = Number(valor);

  return valor.trim() !== "" && Number.isSafeInteger(numero) && numero > 0;
}

// Formata a data do registro
function formatarData(data) {
  return new Date(data).toLocaleString("pt-BR");
}

export default function Entradas({ usuario, voltar, escuro = false }) {
  const styles = escuro ? estilosEscuros : estilosClaros;
  const scrollRef = useRef(null);
  const observacaoRef = useRef(null);

  const [produtos, setProdutos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const [tipoEntrada, setTipoEntrada] = useState("existente");

  // Produto existente
  const [produtoSelecionado, setProdutoSelecionado] = useState("");
  const [mostrarProdutos, setMostrarProdutos] = useState(false);
  const [quantidade, setQuantidade] = useState("");
  const [valorUnitario, setValorUnitario] = useState("");

  // Novo produto
  const [novoCodigo, setNovoCodigo] = useState("");
  const [novoNome, setNovoNome] = useState("");
  const [novaDescricao, setNovaDescricao] = useState("");
  const [novaLocalizacao, setNovaLocalizacao] = useState("");
  const [novaUnidade, setNovaUnidade] = useState("");
  const [estoqueMinimo, setEstoqueMinimo] = useState("");
  const [quantidadeInicial, setQuantidadeInicial] = useState("");
  const [valorUnitarioInicial, setValorUnitarioInicial] = useState("");
  const [imagemNovoProduto, setImagemNovoProduto] = useState(null);
  const [previewNovoProduto, setPreviewNovoProduto] = useState(null);
  const [erroImagemNovoProduto, setErroImagemNovoProduto] = useState("");

  // Campos da entrada
  const [observacao, setObservacao] = useState("");
  const [ultimasEntradas, setUltimasEntradas] = useState([]);
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);
  const [erroHistorico, setErroHistorico] = useState("");
  const [paginaHistorico, setPaginaHistorico] = useState(1);
  const [mensagemSucesso, setMensagemSucesso] = useState("");

  const token = usuario?.token;
  const usuarioId = usuario?.id;

  const administrador = String(usuario?.perfil ?? "").toLowerCase() === "admin";

  // Ajusta a rolagem ao abrir o teclado
  function ajustarCampoObservacao() {
    setTimeout(() => {
      const campo = findNodeHandle(observacaoRef.current);

      if (campo && scrollRef.current) {
        scrollRef.current.scrollResponderScrollNativeHandleToKeyboard(
          campo,
          100,
          true,
        );
      }
    }, 350);
  }

  // Busca os produtos cadastrados
  const carregarProdutos = useCallback(async () => {
    setCarregando(true);
    setErro("");

    if (!token) {
      setErro("Sessão sem autenticação. Faça login novamente.");
      setCarregando(false);
      return;
    }

    if (!administrador) {
      setErro("Apenas administradores podem registrar entradas.");
      setCarregando(false);
      return;
    }

    try {
      const resposta = await fetch(`${API_URL}/produtos/listar`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (resposta.status === 401) {
        throw new Error("Sua sessão expirou. Faça login novamente.");
      }

      if (resposta.status === 403) {
        throw new Error("Você não tem permissão para consultar os produtos.");
      }

      if (!resposta.ok) {
        throw new Error("Não foi possível carregar os produtos.");
      }

      const dados = await resposta.json();

      if (!Array.isArray(dados)) {
        throw new Error("Formato inesperado dos produtos recebidos.");
      }

      // Organiza em ordem alfabética
      const ordenados = [...dados].sort((a, b) =>
        String(a.nome ?? "").localeCompare(String(b.nome ?? ""), "pt-BR", {
          sensitivity: "base",
        }),
      );

      setProdutos(ordenados);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);

      setErro(
        error.message === "Network request failed"
          ? "Não foi possível conectar ao servidor."
          : error.message,
      );
    } finally {
      setCarregando(false);
    }
  }, [token, administrador]);

  // Consulta movimentações persistidas, não apenas registros desta sessão.
  const carregarHistorico = useCallback(async () => {
    if (!token || !administrador) return;
    setCarregandoHistorico(true);
    setErroHistorico("");
    try {
      const resposta = await fetch(`${API_URL}/movimentacoes/listar`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resposta.ok) throw new Error(`Não foi possível carregar o histórico (HTTP ${resposta.status}).`);
      const dados = await resposta.json();
      if (!Array.isArray(dados)) throw new Error("Formato inesperado do histórico.");
      const entradas = dados.filter((item) => String(item.tipo ?? "").toUpperCase() === "ENTRADA");
      entradas.sort((a, b) => {
        const dataA = new Date(a.dataMovimentacao ?? a.dataHora ?? a.data ?? 0).getTime() || 0;
        const dataB = new Date(b.dataMovimentacao ?? b.dataHora ?? b.data ?? 0).getTime() || 0;
        return dataB - dataA || Number(b.id ?? 0) - Number(a.id ?? 0);
      });
      setUltimasEntradas(entradas);
      setPaginaHistorico(1);
    } catch (error) {
      setErroHistorico(error.message || "Não foi possível consultar o histórico.");
    } finally {
      setCarregandoHistorico(false);
    }
  }, [token, administrador]);

  // Atualiza os produtos ao abrir a tela
  useFocusEffect(
    useCallback(() => {
      carregarProdutos();
      carregarHistorico();
    }, [carregarProdutos, carregarHistorico]),
  );

  // Limpa os dados da entrada
  function limparEntradaExistente() {
    setProdutoSelecionado("");
    setQuantidade("");
    setValorUnitario("");
    setObservacao("");
    setMostrarProdutos(false);
    setMensagemSucesso("");
  }

  // Limpa os dados do novo produto
  function limparNovoProduto() {
    setNovoCodigo("");
    setNovoNome("");
    setNovaDescricao("");
    setNovaLocalizacao("");
    setNovaUnidade("");
    setEstoqueMinimo("");
    setQuantidadeInicial("");
    setValorUnitarioInicial("");
    setImagemNovoProduto(null);
    setPreviewNovoProduto(null);
    setErroImagemNovoProduto("");
    setObservacao("");
    setMensagemSucesso("");
  }

  // O Expo Web usa o seletor de arquivos do navegador.
  function selecionarImagemNovoProduto(evento) {
    const arquivo = evento.target.files?.[0];
    if (!arquivo) return;
    if (!["image/jpeg", "image/png"].includes(arquivo.type) || arquivo.size > 5 * 1024 * 1024) {
      setErroImagemNovoProduto("Selecione uma imagem JPG ou PNG de até 5 MB.");
      evento.target.value = "";
      return;
    }
    const leitor = new FileReader();
    leitor.onload = () => {
      setImagemNovoProduto(arquivo);
      setPreviewNovoProduto(typeof leitor.result === "string" ? leitor.result : null);
      setErroImagemNovoProduto("");
    };
    leitor.onerror = () => setErroImagemNovoProduto("Não foi possível ler a imagem.");
    leitor.readAsDataURL(arquivo);
  }

  // Alterna entre entrada e cadastro
  function mudarTipoEntrada(tipo) {
    if (salvando) return;

    setTipoEntrada(tipo);
    setMensagemSucesso("");
    setMostrarProdutos(false);
    setObservacao("");
  }

  // Registra a movimentação no backend
  async function registrarMovimentacao(
    produtoId,
    quantidadeEntrada,
    observacaoEntrada,
    custoUnitario,
  ) {
    const resposta = await fetch(`${API_URL}/movimentacoes/registrar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        produtoId: Number(produtoId),
        usuarioId: Number(usuarioId),
        tipo: "ENTRADA",
        quantidade: quantidadeEntrada,
        valorUnitario: custoUnitario,
        observacao: observacaoEntrada,
      }),
    });

    if (resposta.status === 401) {
      throw new Error("Sua sessão expirou. Faça login novamente.");
    }

    if (resposta.status === 403) {
      throw new Error("Apenas administradores podem registrar entradas.");
    }

    if (!resposta.ok) {
      throw new Error("Não foi possível registrar a entrada.");
    }
  }

  // Registra entrada de produto existente
  async function salvarEntradaExistente() {
    if (salvando || !administrador) return;

    setMensagemSucesso("");

    if (!produtoSelecionado || !quantidadeValida(quantidade)) {
      Alert.alert(
        "Erro",
        "Selecione um produto e informe uma quantidade inteira maior que zero.",
      );
      return;
    }

    const custo = Number(valorUnitario.replace(",", "."));
    if (!valorUnitario.trim() || !Number.isFinite(custo) || custo <= 0) {
      Alert.alert("Erro", "Informe um custo unitário maior que zero.");
      return;
    }

    if (!Number.isSafeInteger(Number(usuarioId))) {
      Alert.alert("Erro", "Não foi possível identificar o usuário logado.");
      return;
    }

    const produto = produtos.find(
      (item) => String(item.id) === String(produtoSelecionado),
    );

    if (!produto) {
      Alert.alert("Erro", "Produto não encontrado.");
      return;
    }

    setSalvando(true);

    try {
      await registrarMovimentacao(
        produto.id,
        Number(quantidade),
        observacao.trim(),
        custo,
      );

      await carregarHistorico();

      setProdutoSelecionado("");
      setQuantidade("");
      setValorUnitario("");
      setObservacao("");
      setMostrarProdutos(false);
      setMensagemSucesso("Entrada registrada com sucesso!");

      await carregarProdutos();
    } catch (error) {
      console.error("Erro ao registrar entrada:", error);

      Alert.alert(
        "Erro",
        error.message === "Network request failed"
          ? "Não foi possível conectar ao servidor."
          : error.message,
      );
    } finally {
      setSalvando(false);
    }
  }

  // Cadastra um produto e registra a primeira entrada
  async function salvarNovoProduto() {
    if (salvando || !administrador) return;

    setMensagemSucesso("");

    const nome = novoNome.trim().toLocaleUpperCase("pt-BR");
    const codigo = novoCodigo.trim().toUpperCase();
    const descricao = novaDescricao.trim();
    const localizacao = novaLocalizacao.trim();
    const minimo = Number(estoqueMinimo);
    const quantidadeRecebida = Number(quantidadeInicial);
    const custoInicial = Number(valorUnitarioInicial.replace(",", "."));

    if (
      !nome ||
      !codigo ||
      !localizacao ||
      !novaUnidade ||
      estoqueMinimo.trim() === "" ||
      quantidadeInicial.trim() === ""
    ) {
      Alert.alert("Erro", "Preencha todos os campos obrigatórios.");
      return;
    }

    if (!Number.isSafeInteger(minimo) || minimo < 0) {
      Alert.alert("Erro", "Digite um estoque mínimo inteiro e não negativo.");
      return;
    }

    if (!quantidadeValida(quantidadeInicial)) {
      Alert.alert(
        "Erro",
        "Digite uma quantidade inicial inteira maior que zero.",
      );
      return;
    }

    if (!valorUnitarioInicial.trim() || !Number.isFinite(custoInicial) || custoInicial <= 0) {
      Alert.alert("Erro", "Informe um custo unitário inicial maior que zero.");
      return;
    }

    if (!Number.isSafeInteger(Number(usuarioId))) {
      Alert.alert("Erro", "Não foi possível identificar o usuário logado.");
      return;
    }

    // Verifica código duplicado
    const codigoExiste = produtos.some(
      (produto) => String(produto.codigo ?? "").toUpperCase() === codigo,
    );

    if (codigoExiste) {
      Alert.alert("Erro", "Já existe um produto cadastrado com esse código.");
      return;
    }

    setSalvando(true);

    try {
      // Cadastra primeiro com quantidade zero
      const resposta = await fetch(`${API_URL}/produtos/registrar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nome,
          codigo,
          descricao,
          localizacao,
          unidadeMedida: novaUnidade,
          estoqueMinimo: minimo,
          quantidade: 0,
        }),
      });

      if (resposta.status === 401) {
        throw new Error("Sua sessão expirou. Faça login novamente.");
      }

      if (resposta.status === 403) {
        throw new Error("Apenas administradores podem cadastrar produtos.");
      }

      if (!resposta.ok) {
        throw new Error("Não foi possível cadastrar o produto.");
      }

      const produtoCriado = await resposta.json();

      if (!produtoCriado?.id) {
        throw new Error(
          "Produto cadastrado, mas o servidor não retornou seu identificador.",
        );
      }

      // O produto já existe no banco. Falha de imagem não pode gerar novo cadastro.
      if (imagemNovoProduto) {
        try {
          const formularioImagem = new FormData();
          formularioImagem.append("arquivo", imagemNovoProduto);
          const respostaImagem = await fetch(`${API_URL}/produtos/${produtoCriado.id}/imagem`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formularioImagem,
          });
          if (!respostaImagem.ok) {
            throw new Error(`Falha ao enviar a imagem (HTTP ${respostaImagem.status}).`);
          }
        } catch (erroImagem) {
          setErroImagemNovoProduto(`Produto cadastrado, mas a imagem não foi enviada: ${erroImagem.message}. Adicione-a posteriormente no Estoque.`);
        }
      }

      // Registra a quantidade recebida
      try {
        await registrarMovimentacao(
          produtoCriado.id,
          quantidadeRecebida,
          observacao.trim(),
          custoInicial,
        );
      } catch (error) {
        setProdutos((anteriores) => [produtoCriado, ...anteriores]);

        setTipoEntrada("existente");
        setProdutoSelecionado(String(produtoCriado.id));
        setQuantidade(String(quantidadeRecebida));
        setValorUnitario(valorUnitarioInicial);
        setMostrarProdutos(false);

        Alert.alert(
          "Produto cadastrado",
          "O produto foi cadastrado, mas sua entrada não foi registrada. Ele foi selecionado para você tentar registrar a quantidade novamente.",
        );

        return;
      }

      await carregarHistorico();

      limparNovoProduto();

      setTipoEntrada("existente");
      setMensagemSucesso(
        "Produto cadastrado e entrada registrada com sucesso!",
      );

      await carregarProdutos();
    } catch (error) {
      console.error("Erro ao cadastrar produto:", error);

      Alert.alert(
        "Erro",
        error.message === "Network request failed"
          ? "Não foi possível conectar ao servidor. Verifique os produtos antes de tentar cadastrar novamente."
          : error.message,
      );
    } finally {
      setSalvando(false);
    }
  }

  const produtoAtual = produtos.find(
    (produto) => String(produto.id) === String(produtoSelecionado),
  );

  const bloqueado = salvando || carregando || !administrador || !!erro;

  return (
    <View style={styles.container}>
      {/* Cabeçalho */}
      <View style={styles.cabecalho}>
        <Pressable style={styles.botaoVoltar} onPress={voltar}>
          <Text style={styles.textoVoltar}>‹</Text>
        </Pressable>

        <LinearGradient colors={["#2563EB", "#38BDF8"]} style={styles.caixaIcone}>
          <PackagePlusIcon width={27} height={27} color="#ffffff" />
        </LinearGradient>

        <View style={styles.areaTitulo}>
          <Text style={styles.etiqueta}>GESTÃO DE MATERIAIS</Text>
          <Text style={styles.titulo}>Entrada de materiais</Text>
          <Text style={styles.subtitulo}>Registre os materiais recebidos no estoque</Text>
        </View>
      </View>

      {/* Ajusta a tela quando o teclado aparece */}
      <KeyboardAvoidingView
        style={styles.areaTeclado}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
      >
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.conteudo}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
        >
          {carregando && (
            <Text style={styles.aviso}>Carregando produtos...</Text>
          )}

          {!!erro && (
            <View style={styles.caixaErro}>
              <Text style={styles.textoErro}>{erro}</Text>

              <Pressable onPress={carregarProdutos}>
                <Text style={styles.textoTentar}>Tentar novamente</Text>
              </Pressable>
            </View>
          )}

          {/* Card de entrada */}
          {administrador && (
            <View style={styles.card}>
              <View style={styles.cabecalhoCard}><View style={styles.pontoAzul} /><View style={{ flex: 1 }}><Text style={styles.cardTitulo}>Nova entrada</Text><Text style={styles.cardDescricao}>Preencha os dados do material recebido.</Text></View></View>

              <Text style={styles.label}>Tipo de entrada</Text>

              <View style={styles.areaTipos}>
                <Pressable
                  disabled={salvando}
                  style={[
                    styles.botaoTipo,
                    tipoEntrada === "existente" && styles.botaoTipoSelecionado,
                  ]}
                  onPress={() => mudarTipoEntrada("existente")}
                >
                  <Text
                    style={[
                      styles.textoTipo,
                      tipoEntrada === "existente" &&
                        styles.textoTipoSelecionado,
                    ]}
                  >
                    Produto existente
                  </Text>
                </Pressable>

                <Pressable
                  disabled={salvando}
                  style={[
                    styles.botaoTipo,
                    tipoEntrada === "novo" && styles.botaoTipoSelecionado,
                  ]}
                  onPress={() => mudarTipoEntrada("novo")}
                >
                  <Text
                    style={[
                      styles.textoTipo,
                      tipoEntrada === "novo" && styles.textoTipoSelecionado,
                    ]}
                  >
                    Novo produto
                  </Text>
                </Pressable>
              </View>

              {/* Produto existente */}
              {tipoEntrada === "existente" && (
                <>
                  <Text style={styles.label}>Produto</Text>

                  <Pressable
                    disabled={bloqueado}
                    style={styles.seletor}
                    onPress={() => setMostrarProdutos(!mostrarProdutos)}
                  >
                    <Text
                      style={[
                        styles.textoSeletor,
                        !produtoAtual && styles.placeholder,
                      ]}
                      numberOfLines={1}
                    >
                      {produtoAtual ? produtoAtual.nome : "Selecionar produto"}
                    </Text>

                    <Text style={styles.setaSeletor}>
                      {mostrarProdutos ? "▲" : "▼"}
                    </Text>
                  </Pressable>

                  {mostrarProdutos && (
                    <View style={styles.listaProdutos}>
                      {produtos.length === 0 && (
                        <Text style={styles.avisoLista}>
                          Nenhum produto cadastrado.
                        </Text>
                      )}

                      {produtos.map((produto) => (
                        <Pressable
                          key={produto.id}
                          style={styles.produtoOpcao}
                          onPress={() => {
                            setProdutoSelecionado(String(produto.id));
                            setMostrarProdutos(false);
                          }}
                        >
                          <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <MiniaturaMaterial produto={produto} token={token} />
                            <View style={{ flex: 1 }}>
                              <Text style={styles.produtoOpcaoTexto}>{produto.nome}</Text>
                              <Text style={styles.produtoCodigo}>Código: {produto.codigo || "-"}</Text>
                            </View>
                          </View>
                        </Pressable>
                      ))}
                    </View>
                  )}

                  <Text style={styles.label}>Quantidade recebida</Text>

                  <TextInput
                    style={styles.input}
                    placeholder="Digite a quantidade"
                    placeholderTextColor="#94a3b8"
                    value={quantidade}
                    onChangeText={setQuantidade}
                    keyboardType="number-pad"
                    editable={!salvando}
                  />

                  <Text style={styles.label}>Custo unitário (R$)</Text>
                  <TextInput style={styles.input} placeholder="Ex.: 12,50" placeholderTextColor="#94a3b8" value={valorUnitario} onChangeText={setValorUnitario} keyboardType="decimal-pad" editable={!salvando} />
                </>
              )}

              {/* Novo produto */}
              {tipoEntrada === "novo" && (
                <>
                  <Text style={styles.label}>Nome do produto</Text>

                  <TextInput
                    style={styles.input}
                    placeholder="Ex.: Papel A4"
                    placeholderTextColor="#94a3b8"
                    value={novoNome}
                    onChangeText={(valor) => setNovoNome(valor.toLocaleUpperCase("pt-BR"))}
                    editable={!salvando}
                  />

                  <Text style={styles.label}>Código / SKU</Text>

                  <TextInput
                    style={styles.input}
                    placeholder="Digite ou gere um código"
                    placeholderTextColor="#94a3b8"
                    value={novoCodigo}
                    onChangeText={setNovoCodigo}
                    autoCapitalize="characters"
                    editable={!salvando}
                  />

                  <Pressable
                    style={styles.botaoCodigo}
                    disabled={salvando}
                    onPress={() => setNovoCodigo(gerarCodigoProduto())}
                  >
                    <Text style={styles.textoCodigo}>Gerar código</Text>
                  </Pressable>

                  <Text style={styles.label}>Descrição</Text>

                  <TextInput
                    style={[styles.input, styles.inputDescricao]}
                    placeholder="Descrição do produto"
                    placeholderTextColor="#94a3b8"
                    value={novaDescricao}
                    onChangeText={setNovaDescricao}
                    multiline
                    textAlignVertical="top"
                    editable={!salvando}
                  />

                  <Text style={styles.label}>Localização</Text>

                  <TextInput
                    style={styles.input}
                    placeholder="Ex.: Prateleira A2"
                    placeholderTextColor="#94a3b8"
                    value={novaLocalizacao}
                    onChangeText={setNovaLocalizacao}
                    editable={!salvando}
                  />

                  <Text style={styles.label}>Unidade de medida</Text>

                  <View style={styles.areaUnidades}>
                    {Object.entries(unidades).map(([valor, rotulo]) => (
                      <Pressable
                        key={valor}
                        disabled={salvando}
                        onPress={() => setNovaUnidade(valor)}
                        style={[
                          styles.botaoUnidade,
                          novaUnidade === valor && styles.unidadeSelecionada,
                        ]}
                      >
                        <Text
                          style={[
                            styles.textoUnidade,
                            novaUnidade === valor &&
                              styles.textoUnidadeSelecionada,
                          ]}
                        >
                          {rotulo}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  <Text style={styles.label}>Estoque mínimo</Text>

                  <TextInput
                    style={styles.input}
                    placeholder="Ex.: 10"
                    placeholderTextColor="#94a3b8"
                    value={estoqueMinimo}
                    onChangeText={setEstoqueMinimo}
                    keyboardType="number-pad"
                    editable={!salvando}
                  />

                  <Text style={styles.label}>Quantidade inicial</Text>

                  <TextInput
                    style={styles.input}
                    placeholder="Quantidade recebida"
                    placeholderTextColor="#94a3b8"
                    value={quantidadeInicial}
                    onChangeText={setQuantidadeInicial}
                    keyboardType="number-pad"
                    editable={!salvando}
                  />

                  <Text style={styles.label}>Custo unitário inicial (R$)</Text>
                  <TextInput style={styles.input} placeholder="Ex.: 12,50" placeholderTextColor="#94a3b8" value={valorUnitarioInicial} onChangeText={setValorUnitarioInicial} keyboardType="decimal-pad" editable={!salvando} />

                  <Text style={styles.label}>Imagem do produto (opcional)</Text>
                  {previewNovoProduto ? (
                    <Image source={{ uri: previewNovoProduto }} style={styles.previewCadastro} resizeMode="contain" />
                  ) : (
                    <View style={styles.areaPreviewCadastro}><Text style={styles.textoPreviewCadastro}>Sem imagem</Text></View>
                  )}
                  {Platform.OS === "web" && (
                    <View style={styles.botoesImagemCadastro}>
                      <label style={{ display: "inline-block", padding: 11, backgroundColor: "#dbeafe", color: "#1d4ed8", fontWeight: 600, borderRadius: 10, cursor: "pointer", fontSize: 13 }}>
                        Selecionar imagem
                        <input type="file" accept="image/jpeg,image/png" disabled={salvando} onChange={selecionarImagemNovoProduto} style={{ display: "none" }} />
                      </label>
                      <Pressable disabled={salvando} onPress={() => { setImagemNovoProduto(null); setPreviewNovoProduto(null); setErroImagemNovoProduto(""); }}>
                        <Text style={{ color: "#dc2626", fontWeight: "600" }}>Remover imagem</Text>
                      </Pressable>
                    </View>
                  )}
                  <Text style={styles.ajudaImagemCadastro}>JPG ou PNG • Até 5 MB</Text>
                  {!!erroImagemNovoProduto && <Text style={{ color: "#dc2626", marginBottom: 12 }}>{erroImagemNovoProduto}</Text>}
                </>
              )}

              {/* Data e observação */}
              <Text style={styles.label}>Data do registro</Text>

              <View style={styles.campoData}>
                <Text style={styles.textoData}>Automática pelo servidor</Text>
              </View>

              <Text style={styles.label}>Observação</Text>

              <TextInput
                ref={observacaoRef}
                style={styles.inputObservacao}
                placeholder="Observação opcional da entrada"
                placeholderTextColor="#94a3b8"
                value={observacao}
                onChangeText={setObservacao}
                onFocus={ajustarCampoObservacao}
                multiline
                textAlignVertical="top"
                editable={!salvando}
              />

              <View style={styles.areaBotoes}>
                <Pressable
                  disabled={bloqueado}
                  style={[
                    styles.botaoSalvar,
                    bloqueado && styles.botaoDesabilitado,
                  ]}
                  onPress={
                    tipoEntrada === "existente"
                      ? salvarEntradaExistente
                      : salvarNovoProduto
                  }
                >
                  <Text style={styles.textoBotaoSalvar}>
                    {salvando
                      ? "Salvando..."
                      : tipoEntrada === "existente"
                        ? "Registrar entrada"
                        : "Cadastrar produto"}
                  </Text>
                </Pressable>

                <Pressable
                  disabled={salvando}
                  style={styles.botaoLimpar}
                  onPress={
                    tipoEntrada === "existente"
                      ? limparEntradaExistente
                      : limparNovoProduto
                  }
                >
                  <Text style={styles.textoBotaoLimpar}>Limpar</Text>
                </Pressable>
              </View>

              {!!mensagemSucesso && (
                <View style={styles.caixaSucesso}>
                  <Text style={styles.textoSucesso}>✓ {mensagemSucesso}</Text>
                </View>
              )}
            </View>
          )}

          {/* Histórico da sessão */}
          <View style={styles.card}>
            <View style={styles.cabecalhoCard}><View style={styles.iconeHistorico}><PackagePlusIcon width={20} height={20} color="#2563EB" /></View><View style={{ flex: 1 }}><Text style={styles.cardTitulo}>Últimas entradas</Text><Text style={styles.cardDescricao}>Registros de entradas salvos no sistema.</Text></View></View>

            {carregandoHistorico && <Text style={styles.semEntrada}>Carregando histórico...</Text>}
            {!!erroHistorico && <Text style={styles.semEntrada}>{erroHistorico}</Text>}
            {!carregandoHistorico && !erroHistorico && ultimasEntradas.length === 0 && (
              <Text style={styles.semEntrada}>
                Nenhuma entrada registrada.
              </Text>
            )}

            {!carregandoHistorico && !erroHistorico && ultimasEntradas.slice((paginaHistorico - 1) * 3, paginaHistorico * 3).map((entrada) => (
              <View key={entrada.id} style={styles.entradaItem}>
                <View style={styles.dadosEntrada}>
                  <Text style={styles.entradaProduto}>{entrada.produtoNome ?? entrada.nomeProduto ?? entrada.produto?.nome ?? produtos.find((produto) => String(produto.id) === String(entrada.produtoId))?.nome ?? `Produto #${entrada.produtoId ?? "-"}`}</Text>

                  <Text style={styles.entradaQuantidade}>
                    +{entrada.quantidade} unidades
                  </Text>


                </View>

                <Text style={styles.entradaData}>{entrada.dataMovimentacao || entrada.dataHora || entrada.data ? formatarData(entrada.dataMovimentacao ?? entrada.dataHora ?? entrada.data) : "-"}</Text>
              </View>
            ))}
            {ultimasEntradas.length > 3 && !carregandoHistorico && !erroHistorico && (
              <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 18, marginTop: 14 }}>
                <Pressable disabled={paginaHistorico === 1} onPress={() => setPaginaHistorico((pagina) => pagina - 1)}>
                  <Text style={{ color: paginaHistorico === 1 ? "#94a3b8" : "#2563eb", fontWeight: "700" }}>‹ Anterior</Text>
                </Pressable>
                <Text style={styles.entradaData}>{paginaHistorico} de {Math.ceil(ultimasEntradas.length / 3)}</Text>
                <Pressable disabled={paginaHistorico >= Math.ceil(ultimasEntradas.length / 3)} onPress={() => setPaginaHistorico((pagina) => pagina + 1)}>
                  <Text style={{ color: paginaHistorico >= Math.ceil(ultimasEntradas.length / 3) ? "#94a3b8" : "#2563eb", fontWeight: "700" }}>Próxima ›</Text>
                </Pressable>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const estilosClaros = StyleSheet.create({
  previewCadastro: { width: 128, height: 128, borderRadius: 12, marginBottom: 12 },
  areaPreviewCadastro: { width: 128, height: 128, borderRadius: 12, backgroundColor: "#f1f5f9", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  textoPreviewCadastro: { color: "#94a3b8", fontSize: 12 },
  botoesImagemCadastro: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 8 },
  ajudaImagemCadastro: { color: "#64748b", fontSize: 12, marginBottom: 18 },
  container: {
    flex: 1,
    backgroundColor: "#F4F7FC",
    paddingHorizontal: 20,
    paddingTop: 36,
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
    backgroundColor: "#EAF1FC",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  textoVoltar: {
    fontSize: 32,
    color: "#2563EB",
    marginTop: -3,
  },

  caixaIcone: {
    width: 48,
    height: 48,
    borderRadius: 15,
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

  etiqueta: { fontSize: 10, fontWeight: "800", color: "#2563EB", letterSpacing: 1.3, marginBottom: 3 },
  cabecalhoCard: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 20 },
  pontoAzul: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#2563EB" },
  cardDescricao: { fontSize: 12, color: "#64748B", marginTop: 4 },
  iconeHistorico: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center" },
  areaTeclado: {
    flex: 1,
  },

  conteudo: {
    paddingBottom: 80,
    flexGrow: 1,
  },

  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E7EDF5",
    padding: 20,
    marginBottom: 18,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.035,
    shadowRadius: 5,
    elevation: 3,
  },

  cardTitulo: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 2,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 8,
  },

  areaTipos: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 22,
  },

  botaoTipo: {
    flex: 1,
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#DBE3EE",
    borderRadius: 12,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },

  botaoTipoSelecionado: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },

  textoTipo: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
    textAlign: "center",
  },

  textoTipoSelecionado: {
    color: "#ffffff",
  },

  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: "#DBE3EE",
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: "#0f172a",
    marginBottom: 18,
    backgroundColor: "#ffffff",
  },

  inputDescricao: {
    minHeight: 85,
    paddingVertical: 12,
  },

  inputObservacao: {
    minHeight: 90,
    maxHeight: 150,
    borderWidth: 1,
    borderColor: "#DBE3EE",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: "#0f172a",
    textAlignVertical: "top",
    marginBottom: 20,
    backgroundColor: "#ffffff",
  },

  seletor: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: "#DBE3EE",
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    backgroundColor: "#ffffff",
  },

  textoSeletor: {
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
    maxHeight: 250,
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
    marginTop: 3,
  },

  avisoLista: {
    padding: 14,
    color: "#64748b",
  },

  botaoCodigo: {
    backgroundColor: "#EFF6FF",
    padding: 13,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 18,
  },

  textoCodigo: {
    color: "#2563EB",
    fontSize: 14,
    fontWeight: "600",
  },

  areaUnidades: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 18,
  },

  botaoUnidade: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
  },

  unidadeSelecionada: {
    backgroundColor: "#DBEAFE",
  },

  textoUnidade: {
    fontSize: 13,
    color: "#475569",
  },

  textoUnidadeSelecionada: {
    color: "#1D4ED8",
    fontWeight: "bold",
  },

  campoData: {
    minHeight: 50,
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    paddingHorizontal: 14,
    justifyContent: "center",
    marginBottom: 18,
  },

  textoData: {
    color: "#64748b",
    fontSize: 14,
  },

  areaBotoes: {
    flexDirection: "row",
    gap: 10,
  },

  botaoSalvar: {
    flex: 1,
    minHeight: 50,
    backgroundColor: "#2563EB",
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
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "#DBE3EE",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  textoBotaoLimpar: {
    color: "#475569",
    fontSize: 15,
    fontWeight: "600",
  },

  caixaSucesso: {
    backgroundColor: "#dcfce7",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: 10,
    padding: 12,
    marginTop: 14,
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
    color: "#166534",
    fontWeight: "600",
    fontSize: 14,
  },

  semEntrada: {
    fontSize: 14,
    color: "#94a3b8",
  },

  entradaItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },

  dadosEntrada: {
    flex: 1,
    paddingRight: 10,
  },

  entradaProduto: {
    fontSize: 15,
    fontWeight: "600",
    color: "#334155",
  },

  entradaQuantidade: {
    fontSize: 13,
    color: "#16a34a",
    marginTop: 3,
  },

  novoProdutoHistorico: {
    fontSize: 11,
    color: "#15803d",
    fontWeight: "600",
    marginTop: 3,
  },

  entradaData: {
    fontSize: 12,
    color: "#94a3b8",
    maxWidth: 115,
    textAlign: "right",
  },
});


// Paleta escura compartilhada com o restante do SIA-Mobile.
// Mantém cores semânticas (sucesso, erro, status e seleção ativa).
const mapaCoresEscuras = {
  "#f4f7fc": "#0f172a", "#F4F7FC": "#0f172a",
  "#ffffff": "#1e293b", "#FFFFFF": "#1e293b",
  "#f1f5f9": "#243247", "#F1F5F9": "#243247",
  "#e2e8f0": "#334155", "#E2E8F0": "#334155",
  "#e7edf5": "#334155", "#E7EDF5": "#334155",
  "#DBE3EE": "#334155", "#cbd5e1": "#475569",
  "#0f172a": "#f1f5f9", "#1e293b": "#f1f5f9",
  "#334155": "#cbd5e1", "#475569": "#cbd5e1",
  "#64748b": "#94a3b8", "#64748B": "#94a3b8",
  "#1e3a8a": "#93c5fd", "#2563eb": "#818cf8", "#2563EB": "#818cf8",
  "#EFF6FF": "#243247", "#dbeafe": "#273449", "#DBEAFE": "#273449",
  "#EAF1FC": "#243247", "#1d4ed8": "#a5b4fc", "#1D4ED8": "#a5b4fc",
};
const coresTextoEscuro = { "#0f172a": "#f1f5f9", "#1e293b": "#f1f5f9", "#334155": "#cbd5e1", "#475569": "#cbd5e1", "#64748b": "#94a3b8", "#64748B": "#94a3b8" };
const estilosEscuros = StyleSheet.create(Object.fromEntries(
  Object.entries(estilosClaros).map(([nome, estilo]) => {
    const alterado = { ...estilo };
    for (const propriedade of ["backgroundColor", "borderColor", "borderBottomColor", "borderTopColor", "color"]) {
      const cor = alterado[propriedade];
      if (typeof cor === "string" && mapaCoresEscuras[cor]) {
        // Botões azuis selecionados e seus textos brancos devem continuar legíveis.
        if (propriedade === "color" && cor === "#ffffff" && /Selecionad|Ativ|Salvar/.test(nome)) continue;
        if (propriedade === "backgroundColor" && (nome === "botaoSalvar" || nome === "botaoTipoSelecionado" || nome === "paginaAtiva")) continue;
        alterado[propriedade] = mapaCoresEscuras[cor];
      }
    }
    if (nome === "input" || nome === "inputObservacao" || nome === "pesquisa") {
      alterado.backgroundColor = "#172235";
      alterado.color = "#f1f5f9";
    }
    return [nome, alterado];
  })
));
