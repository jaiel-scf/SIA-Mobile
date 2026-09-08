import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

// importa a tela de login
import Login from './components/Login';

// importa a tela inicial
import Inicio from './components/Inicio';

export default function App() {
  // guarda qual tela esta aparecendo
  const [telaAtual, setTelaAtual] = useState('login');

  // guarda os dados do usuario depois do login
  const [usuario, setUsuario] = useState(null);

  // esta funcao recebe os dados vindos do Login
  function entrar(dadosUsuario) {
    setUsuario(dadosUsuario);
    setTelaAtual('inicio');
  }

  // estas funcoes sao dos botoes da tela inicial
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
      {/* se estiver no login, mostra a tela Login */}
      {telaAtual === 'login' && <Login entrar={entrar} />}

      {/* se estiver no inicio, mostra a tela Inicio */}
      {telaAtual === 'inicio' && (
        <Inicio
          usuario={usuario}
          irParaEstoque={irParaEstoque}
          irParaEntradas={irParaEntradas}
          irParaSaidas={irParaSaidas}
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
