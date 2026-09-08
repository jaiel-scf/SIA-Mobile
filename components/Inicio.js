import { Button, StyleSheet, Text, View } from 'react-native';

export default function Inicio({
  usuario, irParaEstoque, irParaEntradas, irParaSaidas, voltarParaLogin,}) 

  {return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Tela Inicial</Text>

      {/* mostra o nome do usuario logado */}
      <Text style={styles.textoBoasVindas}>
        Bem-vindo, {usuario?.nome || 'Usuario'}
      </Text>

      {/* cards de resumo do que acontecei no sistema */}
      <View style={styles.card}>
        <Text style={styles.cardTitulo}>Produtos cadastrados</Text>
        <Text style={styles.cardNumero}>150</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitulo}>Entradas hoje</Text>
        <Text style={styles.cardNumero}>10</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitulo}>Saidas hoje</Text>
        <Text style={styles.cardNumero}>10</Text>
      </View>

      {/* atalhos */}
      <View style={styles.botao}>
        <Button title="Ir para Estoque" onPress={irParaEstoque} color="#2563eb" />
      </View>

      <View style={styles.botao}>
        <Button title="Registrar Entrada" onPress={irParaEntradas} color="#2563eb" />
      </View>

      <View style={styles.botao}>
        <Button title="Registrar Saida" onPress={irParaSaidas} color="#2563eb" />
      </View>

      {/* ultimas movimentacoes */}
      <View style={styles.cardMovimentacoes}>
        <Text style={styles.movTitulo}>Últimas movimentaçoes</Text>

        <Text style={styles.movItem}>Entrada de Mouse USB</Text>
        <Text style={styles.movDescricao}>Quantidade adicionada ao estoque.</Text>

        <Text style={styles.movItem}>Saida de Monitor 24"</Text>
        <Text style={styles.movDescricao}>Item retirado do estoque.</Text>

        <Text style={styles.movItem}>Entrada de Teclado ABNT2</Text>
        <Text style={styles.movDescricao}>Reposicao de itens no almoxarifado.</Text>
      </View>

      {/* botao para voltar a tela de login */}
      <View style={styles.botaoVoltar}>
        <Button title="Voltar ao Login" onPress={voltarParaLogin} color="#dc2626" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 20,
    justifyContent: 'center',
  },
  titulo: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1e3a8a',
    marginBottom: 10,
  },
  textoBoasVindas: {
    fontSize: 18,
    textAlign: 'center',
    color: '#334155',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
  },
  cardTitulo: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 6,
  },
  cardNumero: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  botao: {
    marginBottom: 10,
  },
  cardMovimentacoes: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 12,
    marginTop: 10,
  },
  movTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 12,
  },
  movItem: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#334155',
    marginTop: 8,
  },
  movDescricao: {
    fontSize: 14,
    color: '#64748b',
  },
  botaoVoltar: {
    marginTop: 15,
  },
});









// Ainda falta adicionar os icones