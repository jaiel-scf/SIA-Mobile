import { useCallback, useState } from "react";

import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { useFocusEffect } from "@react-navigation/native";

import { API_URL } from "../config/api";

import ClipboardListIcon from "../assets/icons/clipboard-list.svg";
import ArrowDownIcon from "../assets/icons/circle-arrow-down.svg";
import ArrowRightIcon from "../assets/icons/circle-arrow-right.svg";
import ArrowUpIcon from "../assets/icons/circle-arrow-up.svg";

const PRODUTOS_POR_PAGINA = 3;

const unidades = {
  UNIDADE: "Unidade",
  CAIXA: "Caixa",
  PACOTE: "Pacote",
  METRO: "Metro",
  LITRO: "Litro",
  QUILO: "Quilo",
};

// Verifica a situação do estoque para o administrador
function verificarEstoque(produto) {
  const quantidade = Number(produto.quantidade ?? 0);
  const minimo = Number(produto.estoqueMinimo ?? 0);

  if (minimo <= 0) {
    if (quantidade <= 0) {
      return {
        texto: "Crítico",
        cor: "#dc2626",
        fundo: "#fee2e2",
        icone: ArrowDownIcon,
      };
    }

    return {
      texto: "Normal",
      cor: "#16a34a",
      fundo: "#dcfce7",
      icone: ArrowUpIcon,
    };
  }

  if (quantidade <= minimo) {
    return {
      texto: "Crítico",
      cor: "#dc2626",
      fundo: "#fee2e2",
      icone: ArrowDownIcon,
    };
  }

  if (quantidade <= minimo * 1.5) {
    return {
      texto: "Baixo",
      cor: "#a16207",
      fundo: "#fef3c7",
      icone: ArrowRightIcon,
    };
  }

  return {
    texto: "Normal",
    cor: "#16a34a",
    fundo: "#dcfce7",
    icone: ArrowUpIcon,
  };
}

// Gera um código SKU
function gerarCodigoProduto() {
  const data = new Date();

  const dia = String(data.getDate()).padStart(2, "0");
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const ano = String(data.getFullYear()).slice(-2);

  const caracteres = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  let sufixo = "";

  for (let i = 0; i < 4; i++) {
    sufixo += caracteres[Math.floor(Math.random() * caracteres.length)];
  }

  return `P${ano}${mes}${dia}.${sufixo}`;
}

export default function Estoque({ usuario, voltar }) {
  // Lista de produtos e pesquisa
  const [produtos, setProdutos] = useState([]);
  const [pesquisa, setPesquisa] = useState("");
  const [paginaAtual, setPaginaAtual] = useState(1);

  // Carregamento e mensagens
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState("");

  // Produto selecionado para edição
  const [produtoEditando, setProdutoEditando] = useState(null);

  // Campos de edição do produto
  const [codigo, setCodigo] = useState("");
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [localizacao, setLocalizacao] = useState("");
  const [unidadeMedida, setUnidadeMedida] = useState("UNIDADE");
  const [estoqueMinimo, setEstoqueMinimo] = useState("");

  // Identifica usuário e permissões
  const token = usuario?.token ?? usuario?.accessToken;

  const administrador = String(usuario?.perfil ?? "").toLowerCase() === "admin";

  // Carrega os produtos do backend
  const carregarEstoque = useCallback(async () => {
    setCarregando(true);
    setErro("");

    if (!token) {
      setErro("Sessão sem token. Faça login novamente.");
      setCarregando(false);
      return;
    }

    try {
      const resposta = await fetch(`${API_URL}/produtos/listar`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (resposta.status === 401) {
        throw new Error("Sua sessão expirou. Faça login novamente.");
      }

      if (!resposta.ok) {
        throw new Error(`Não foi possível carregar o estoque (${resposta.status}).`);
      }

      const dados = await resposta.json();

      if (!Array.isArray(dados)) {
        throw new Error("Formato inesperado da lista de produtos.");
      }

      // Organiza os produtos por nome
      const produtosOrdenados = [...dados].sort((a, b) =>
        String(a.nome ?? "").localeCompare(String(b.nome ?? ""), "pt-BR", { sensitivity: "base" }),
      );

      setProdutos(produtosOrdenados);
    } catch (error) {
      setErro(error.message === "Network request failed" ? "Não foi possível conectar ao servidor." : error.message);
    } finally {
      setCarregando(false);
    }
  }, [token]);

  // Atualiza o estoque quando a tela é aberta
  useFocusEffect(
    useCallback(() => {
      carregarEstoque();
    }, [carregarEstoque]),
  );

  // Prepara a edição de um produto
  function editarProduto(produto) {
    if (!administrador) return;

    setProdutoEditando(produto);

    setCodigo(String(produto.codigo ?? ""));
    setNome(String(produto.nome ?? ""));
    setDescricao(String(produto.descricao ?? ""));
    setLocalizacao(String(produto.localizacao ?? ""));

    setUnidadeMedida(produto.unidadeMedida ?? "UNIDADE");

    setEstoqueMinimo(String(produto.estoqueMinimo ?? 0));

    setMensagemSucesso("");
  }

  // Cancela a edição
  function cancelarEdicao() {
    setProdutoEditando(null);
  }

  // Salva alterações do produto
  async function salvarEdicao() {
    if (!administrador || !produtoEditando || salvando) {
      return;
    }

    const dados = {
      nome: nome.trim(),
      codigo: codigo.trim().toUpperCase(),
      descricao: descricao.trim(),
      localizacao: localizacao.trim(),
      unidadeMedida,
      estoqueMinimo: Number(estoqueMinimo),
    };

    // Valida os campos obrigatórios
    if (!dados.nome || !dados.codigo || !dados.localizacao || !dados.unidadeMedida || estoqueMinimo.trim() === "") {
      Alert.alert("Erro", "Preencha os campos obrigatórios.");
      return;
    }

    if (!Number.isSafeInteger(dados.estoqueMinimo) || dados.estoqueMinimo < 0) {
      Alert.alert("Erro", "Digite um estoque mínimo inteiro e não negativo.");
      return;
    }

    // Impede código duplicado
    const codigoExiste = produtos.some(
      (produto) => produto.id !== produtoEditando.id && String(produto.codigo ?? "").toUpperCase() === dados.codigo,
    );

    if (codigoExiste) {
      Alert.alert("Erro", "Já existe outro produto com esse código.");
      return;
    }

    setSalvando(true);

    try {
      const resposta = await fetch(`${API_URL}/produtos/${produtoEditando.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dados),
      });

      if (resposta.status === 403) {
        throw new Error("Apenas administradores podem editar produtos.");
      }

      if (!resposta.ok) {
        throw new Error(`Não foi possível editar o produto (${resposta.status}).`);
      }

      cancelarEdicao();

      setMensagemSucesso("Produto atualizado com sucesso.");

      await carregarEstoque();
    } catch (error) {
      Alert.alert("Erro", error.message);
    } finally {
      setSalvando(false);
    }
  }

  // Inativa um produto, preservando o histórico
  function excluirProduto(produto) {
    if (!administrador) return;

    Alert.alert("Excluir produto", `Deseja inativar "${produto.nome}"? O histórico será preservado.`, [
      {
        text: "Cancelar",
        style: "cancel",
      },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          try {
            const resposta = await fetch(`${API_URL}/produtos/${produto.id}/inativar`, {
              method: "PUT",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });

            if (resposta.status === 403) {
              throw new Error("Apenas administradores podem excluir produtos.");
            }

            if (!resposta.ok) {
              throw new Error(`Não foi possível excluir o produto (${resposta.status}).`);
            }

            setMensagemSucesso("Produto inativado com sucesso.");

            await carregarEstoque();
          } catch (error) {
            Alert.alert("Erro", error.message);
          }
        },
      },
    ]);
  }

  // Pesquisa todos os produtos por nome ou código
  const produtosFiltrados = produtos.filter((produto) => {
    const termo = pesquisa.trim().toLocaleLowerCase("pt-BR");

    const nomeProduto = String(produto.nome ?? "").toLocaleLowerCase("pt-BR");

    const codigoProduto = String(produto.codigo ?? "").toLocaleLowerCase("pt-BR");

    return nomeProduto.includes(termo) || codigoProduto.includes(termo);
  });

  // Calcula as páginas
  const totalPaginas = Math.ceil(produtosFiltrados.length / PRODUTOS_POR_PAGINA);

  const paginaSegura = Math.min(paginaAtual, Math.max(1, totalPaginas));

  const indiceInicial = (paginaSegura - 1) * PRODUTOS_POR_PAGINA;

  const produtosDaPagina = produtosFiltrados.slice(indiceInicial, indiceInicial + PRODUTOS_POR_PAGINA);

  // Pesquisa e volta para a primeira página
  function pesquisarProdutos(texto) {
    setPesquisa(texto);
    setPaginaAtual(1);
  }

  // Muda a página
  function mudarPagina(novaPagina) {
    if (novaPagina < 1 || novaPagina > totalPaginas || novaPagina === paginaSegura) {
      return;
    }

    setPaginaAtual(novaPagina);
  }

  // Gera a lista de páginas compacta
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
          <ClipboardListIcon width={27} height={27} color="#ffffff" />
        </View>

        <View>
          <Text style={styles.titulo}>Estoque</Text>

          <Text style={styles.subtitulo}>Produtos cadastrados</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.lista}
        keyboardShouldPersistTaps="handled"
      >
        {/* Campo de pesquisa */}
        <TextInput
          style={styles.pesquisa}
          placeholder="Buscar produto ou código"
          placeholderTextColor="#94a3b8"
          value={pesquisa}
          onChangeText={pesquisarProdutos}
        />

        {/* Carregamento */}
        {carregando && <Text style={styles.aviso}>Carregando estoque...</Text>}

        {/* Mensagem de erro */}
        {!!erro && (
          <>
            <Text style={styles.erro}>{erro}</Text>

            <Pressable onPress={carregarEstoque}>
              <Text style={styles.textoEditar}>Tentar novamente</Text>
            </Pressable>
          </>
        )}

        {/* Formulário de edição - somente administrador */}
        {produtoEditando && administrador && (
          <View style={styles.cardFormulario}>
            <Text style={styles.tituloFormulario}>Editar produto</Text>

            <View style={styles.quantidadeAtual}>
              <Text style={styles.quantidadeAtualTexto}>Quantidade atual</Text>

              <Text style={styles.quantidadeAtualNumero}>{produtoEditando.quantidade}</Text>
            </View>

            <Text style={styles.label}>Código / SKU</Text>

            <TextInput style={styles.input} value={codigo} onChangeText={setCodigo} autoCapitalize="characters" />

            <Pressable style={styles.botaoCodigo} onPress={() => setCodigo(gerarCodigoProduto())}>
              <Text style={styles.textoCodigo}>Gerar código</Text>
            </Pressable>

            <Text style={styles.label}>Nome</Text>

            <TextInput style={styles.input} value={nome} onChangeText={setNome} />

            <Text style={styles.label}>Descrição</Text>

            <TextInput style={styles.input} value={descricao} onChangeText={setDescricao} multiline />

            <Text style={styles.label}>Localização</Text>

            <TextInput style={styles.input} value={localizacao} onChangeText={setLocalizacao} />

            <Text style={styles.label}>Unidade de medida</Text>

            <View style={styles.areaUnidades}>
              {Object.entries(unidades).map(([valor, rotulo]) => (
                <Pressable
                  key={valor}
                  style={[styles.botaoUnidade, unidadeMedida === valor && styles.unidadeSelecionada]}
                  onPress={() => setUnidadeMedida(valor)}
                >
                  <Text style={[styles.textoUnidade, unidadeMedida === valor && styles.textoUnidadeSelecionada]}>
                    {rotulo}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Estoque mínimo</Text>

            <TextInput
              style={styles.input}
              value={estoqueMinimo}
              onChangeText={setEstoqueMinimo}
              keyboardType="number-pad"
            />

            <View style={styles.areaBotoes}>
              <Pressable
                style={[styles.botaoSalvar, salvando && styles.botaoDesabilitado]}
                disabled={salvando}
                onPress={salvarEdicao}
              >
                <Text style={styles.textoBotaoSalvar}>{salvando ? "Salvando..." : "Salvar alterações"}</Text>
              </Pressable>

              <Pressable style={styles.botaoCancelar} disabled={salvando} onPress={cancelarEdicao}>
                <Text style={styles.textoBotaoCancelar}>Cancelar</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Mensagem de sucesso */}
        {!!mensagemSucesso && (
          <View style={styles.caixaSucesso}>
            <Text style={styles.textoSucesso}>✓ {mensagemSucesso}</Text>
          </View>
        )}

        {/* Produtos da página atual */}
        {!carregando &&
          !erro &&
          produtosDaPagina.map((produto) => {
            // Indicadores utilizados pelo administrador
            const situacao = administrador ? verificarEstoque(produto) : null;

            const IconeStatus = situacao?.icone;

            return (
              <View key={produto.id} style={styles.card}>
                <View style={styles.dadosProduto}>
                  <Text style={styles.nomeProduto}>{produto.nome}</Text>

                  {!!produto.descricao && <Text style={styles.descricaoProduto}>{produto.descricao}</Text>}

                  {/* Localização somente para administrador */}
                  {administrador && !!produto.localizacao && (
                    <Text style={styles.rotulo}>Localização: {produto.localizacao}</Text>
                  )}

                  <Text style={styles.codigoProduto}>Código: {produto.codigo || "-"}</Text>

                  <Text style={styles.rotulo}>
                    Unidade: {unidades[produto.unidadeMedida] || produto.unidadeMedida || "-"}
                  </Text>

                  {/* Edição e exclusão somente para administrador */}
                  {administrador && (
                    <View style={styles.linhaAcoes}>
                      <Pressable style={styles.botaoEditar} onPress={() => editarProduto(produto)}>
                        <Text style={styles.textoEditar}>Editar</Text>
                      </Pressable>

                      <Pressable style={styles.botaoExcluir} onPress={() => excluirProduto(produto)}>
                        <Text style={styles.textoExcluir}>Excluir</Text>
                      </Pressable>
                    </View>
                  )}
                </View>

                {/* Quantidade do produto */}
                <View style={styles.areaQuantidade}>
                  <Text style={styles.textoQuantidade}>Quantidade</Text>

                  {/* Admin: número colorido.
                      Usuário comum: número sem alerta. */}
                  <Text
                    style={[
                      styles.quantidade,
                      administrador && {
                        color: situacao.cor,
                      },
                    ]}
                  >
                    {produto.quantidade ?? 0}
                  </Text>

                  {/* Status e ícone somente para administrador */}
                  {administrador && (
                    <View
                      style={[
                        styles.status,
                        {
                          backgroundColor: situacao.fundo,
                        },
                      ]}
                    >
                      <IconeStatus width={18} height={18} color={situacao.cor} />

                      <Text
                        style={[
                          styles.statusTexto,
                          {
                            color: situacao.cor,
                          },
                        ]}
                      >
                        {situacao.texto}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}

        {/* Nenhum produto encontrado */}
        {!carregando && !erro && produtosFiltrados.length === 0 && (
          <Text style={styles.semProduto}>Nenhum produto encontrado.</Text>
        )}

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
      </ScrollView>
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
    color: "#1e3a8a",
    marginTop: -3,
  },

  caixaIcone: {
    width: 45,
    height: 45,
    borderRadius: 13,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
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

  lista: {
    paddingBottom: 45,
  },

  pesquisa: {
    height: 50,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 15,
    color: "#0f172a",
    marginBottom: 20,
  },

  // Formulário de edição
  cardFormulario: {
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

  tituloFormulario: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 18,
  },

  quantidadeAtual: {
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  quantidadeAtualTexto: {
    fontSize: 14,
    color: "#64748b",
  },

  quantidadeAtualNumero: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0f172a",
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 8,
  },

  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: "#0f172a",
    marginBottom: 18,
  },

  areaUnidades: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 18,
  },

  botaoUnidade: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
  },

  unidadeSelecionada: {
    backgroundColor: "#dbeafe",
  },

  textoUnidade: {
    color: "#475569",
    fontSize: 13,
  },

  textoUnidadeSelecionada: {
    color: "#1d4ed8",
    fontWeight: "600",
  },

  areaBotoes: {
    flexDirection: "row",
    gap: 10,
  },

  botaoSalvar: {
    flex: 1,
    minHeight: 50,
    backgroundColor: "#2563eb",
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

  botaoCancelar: {
    minHeight: 50,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  textoBotaoCancelar: {
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

  // Card de produto
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
  },

  dadosProduto: {
    flex: 1,
    paddingRight: 10,
  },

  nomeProduto: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 5,
  },

  descricaoProduto: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 6,
  },

  codigoProduto: {
    fontSize: 12,
    color: "#94a3b8",
  },

  rotulo: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 3,
  },

  linhaAcoes: {
    flexDirection: "row",
    gap: 16,
    marginTop: 10,
  },

  botaoEditar: {
    alignSelf: "flex-start",
  },

  textoEditar: {
    color: "#2563eb",
    fontSize: 13,
    fontWeight: "600",
  },

  botaoExcluir: {
    alignSelf: "flex-start",
  },

  textoExcluir: {
    color: "#dc2626",
    fontSize: 13,
    fontWeight: "600",
  },

  // Quantidade visível para todos
  areaQuantidade: {
    alignItems: "center",
    minWidth: 95,
  },

  textoQuantidade: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 3,
  },

  // Cor padrão para usuário comum
  quantidade: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 6,
  },

  // Indicadores de estoque para o administrador
  status: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
  },

  statusTexto: {
    fontSize: 12,
    fontWeight: "bold",
  },

  semProduto: {
    textAlign: "center",
    color: "#64748b",
    marginTop: 30,
  },

  botaoCodigo: {
    marginBottom: 16,
    alignSelf: "flex-start",
  },

  textoCodigo: {
    color: "#2563eb",
    fontWeight: "600",
  },

  aviso: {
    color: "#64748b",
    textAlign: "center",
    marginBottom: 15,
  },

  erro: {
    color: "#dc2626",
    textAlign: "center",
    marginBottom: 15,
  },

  // Paginação
  areaPaginacao: {
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 18,
    marginTop: 10,
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
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
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
});
