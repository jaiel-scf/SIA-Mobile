import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>SIA-Mobile</Text>
      <Text style={styles.subtitulo}>Sistema de Almoxarifado</Text>

      <View style={styles.botao}>
        <Text style={styles.textoBotao}>Ir para Login</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#00f4fc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: {
    fontSize: 30,
    fontWeight: 'bold',
  },
  subtitulo: {
    fontSize: 20,
    marginBottom: 20,
  },
  botao: {
    backgroundColor: 'blue',
    padding: 10,
    borderRadius: 5,
  },
  textoBotao: {
    color: 'white',
    fontSize: 16,
  },
});
