import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

// importação da tela de login
import Login from './components/Login';

// importação da tela inicial
import Inicio from './components/Inicio';

export default function App() {
  // me mostra qual tela esta visivel
  const [telaAtual, setTelaAtual] = useState('login');

  // guarda os dados do usuario depois do login
  const [usuario, setUsuario] = useState(null);

  // esta função recebe os dados vindos do Login
  function entrar(dadosUsuario) {
    setUsuario(dadosUsuario);
    setTelaAtual('inicio');
  }

  // esta função volta para a tela de login
  function voltarParaLogin() {
    setUsuario(null);
    setTelaAtual('login');
  }

  // estas funções são dos botões da tela inicial, no momento eles só estão dizendo oque cada botão faz
  function irParaEstoque() {
    Alert.alert('Estoque', 'Aqui vai abrir a tela de Estoque.');
  }

  function irParaEntradas() {
    Alert.alert('Entradas', 'Aqui vai abrir a tela de Entradas.');
  }

  function irParaSaidas() {
    Alert.alert('Saidas', 'Aqui vai abrir a tela de Saidas.');
  }

  return (
    <View style={styles.container}>
      {telaAtual === 'login' && <Login entrar={entrar} />}
      {telaAtual === 'inicio' && (
        <Inicio
          usuario={usuario}
          irParaEstoque={irParaEstoque}
          irParaEntradas={irParaEntradas}
          irParaSaidas={irParaSaidas}
          voltarParaLogin={voltarParaLogin}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});







// Ainda falta adicionar os icones