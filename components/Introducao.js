import { useEffect, useRef } from "react";

import { Animated, StyleSheet, Text, View } from "react-native";

import { LinearGradient } from "expo-linear-gradient";

import BlocksIcon from "../assets/icons/blocks.svg";

export default function Introducao({ finalizar }) {
  // Controla a entrada do ícone
  const opacidadeLogo = useRef(new Animated.Value(0)).current;

  const escalaLogo = useRef(new Animated.Value(0.75)).current;

  // Controla a entrada do título
  const opacidadeTitulo = useRef(new Animated.Value(0)).current;

  const movimentoTitulo = useRef(new Animated.Value(20)).current;

  // Controla a entrada do subtítulo
  const opacidadeSubtitulo = useRef(new Animated.Value(0)).current;

  const movimentoSubtitulo = useRef(new Animated.Value(15)).current;

  useEffect(() => {
    // Animação do ícone
    const animacaoLogo = Animated.parallel([
      Animated.timing(opacidadeLogo, {
        toValue: 1,
        duration: 650,
        useNativeDriver: true,
      }),

      Animated.spring(escalaLogo, {
        toValue: 1,
        friction: 6,
        tension: 55,
        useNativeDriver: true,
      }),
    ]);

    // Animação do nome SIA
    const animacaoTitulo = Animated.parallel([
      Animated.timing(opacidadeTitulo, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),

      Animated.timing(movimentoTitulo, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]);

    // Animação do subtítulo
    const animacaoSubtitulo = Animated.parallel([
      Animated.timing(opacidadeSubtitulo, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),

      Animated.timing(movimentoSubtitulo, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]);

    // Executa as animações em sequência
    const animacaoCompleta = Animated.sequence([animacaoLogo, animacaoTitulo, animacaoSubtitulo]);

    animacaoCompleta.start();

    // Depois de 2,5 segundos abre o Login
    const temporizador = setTimeout(() => {
      finalizar();
    }, 2500);

    // Limpa o temporizador ao sair da tela
    return () => {
      clearTimeout(temporizador);
      animacaoCompleta.stop();
    };
  }, [finalizar, opacidadeLogo, escalaLogo, opacidadeTitulo, movimentoTitulo, opacidadeSubtitulo, movimentoSubtitulo]);

  return (
    <LinearGradient colors={["#0f172a", "#1e3a8a", "#1d4ed8"]} style={styles.container}>
      <View style={styles.conteudo}>
        {/* Ícone oficial do SIA, igual ao Login */}
        <Animated.View
          style={[
            styles.areaLogo,
            {
              opacity: opacidadeLogo,
              transform: [{ scale: escalaLogo }],
            },
          ]}
        >
          <LinearGradient colors={["#2563eb", "#38bdf8"]} style={styles.logo}>
            <BlocksIcon width={48} height={48} color="#ffffff" />
          </LinearGradient>
        </Animated.View>

        {/* Nome do sistema */}
        <Animated.View
          style={{
            opacity: opacidadeTitulo,
            transform: [{ translateY: movimentoTitulo }],
          }}
        >
          <Text style={styles.titulo}>SIA</Text>
        </Animated.View>

        {/* Subtítulo */}
        <Animated.View
          style={{
            opacity: opacidadeSubtitulo,
            transform: [{ translateY: movimentoSubtitulo }],
          }}
        >
          <Text style={styles.subtitulo}>Sistema de Almoxarifado</Text>
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  // Fundo da introdução
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // Conteúdo centralizado
  conteudo: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },

  // Área do ícone
  areaLogo: {
    marginBottom: 24,
  },

  // Mesmo estilo do ícone do Login
  logo: {
    width: 90,
    height: 90,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },

  // Nome do SIA
  titulo: {
    fontSize: 52,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
  },

  // Descrição
  subtitulo: {
    fontSize: 19,
    color: "#dbeafe",
    textAlign: "center",
    marginTop: 12,
  },
});
