import { useState } from 'react';
import { Alert, Button, StyleSheet, Text, TextInput, View } from 'react-native';

export default function Login({ entrar }) {
  // guarda o nome digitado
  const [nome, setNome] = useState('');

  // deixa o perfil fixo por enquanto
  const [perfil] = useState('Administrador');

  // funcao executada quando clicar no botao Entrar
  function fazerLogin() {
    // verifica se o nome foi preenchido
    if (nome.trim() === '') {
      Alert.alert('Erro', 'Preencha o nome do usuario.');
      return;
    }

    // manda os dados para o App.js
    entrar({
      nome: nome.trim(),
      perfil: perfil,
    });
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* titulo principal */}
        <Text style={styles.titulo}>SIA</Text>
        <Text style={styles.subtitulo}>Sistema de Almoxarifado</Text>

        {/* campo nome */}
        <Text style={styles.label}>Nome</Text>
        <TextInput
          style={styles.input}
          placeholder="Digite seu nome"
          value={nome}
          onChangeText={setNome}
        />

        {/* perfil fixo */}
        <Text style={styles.label}>Perfil</Text>
        <View style={styles.caixaPerfil}>
          <Text style={styles.textoPerfil}>{perfil}</Text>
        </View>

        {/* botao para entrar */}
        <View style={styles.botao}>
          <Button title="Entrar" onPress={fazerLogin} color="#2563eb" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
  },
  titulo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1e3a8a',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitulo: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    backgroundColor: '#ffffff',
  },
  caixaPerfil: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    padding: 12,
    marginBottom: 25,
    backgroundColor: '#e2e8f0',
  },
  textoPerfil: {
    fontSize: 16,
    color: '#334155',
  },
  botao: {
    marginTop: 10,
  },
});
