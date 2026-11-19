import { useEffect, useRef, useState } from "react";
import { Animated, Platform, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const LIMITE = 5;

export default function CartaoBoasVindas({ nome, perfil }) {
  const eixoX = useRef(new Animated.Value(0)).current;
  const eixoY = useRef(new Animated.Value(0)).current;
  const profundidade = useRef(new Animated.Value(0)).current;
  const [largura, setLargura] = useState(1);
  const [altura, setAltura] = useState(1);

  useEffect(() => {
    return () => {
      eixoX.stopAnimation();
      eixoY.stopAnimation();
      profundidade.stopAnimation();
    };
  }, [eixoX, eixoY, profundidade]);

  function animar(valorX, valorY, pressionado) {
    const configuracao = { stiffness: 160, damping: 22, mass: 0.8, useNativeDriver: true };
    Animated.parallel([
      Animated.spring(eixoX, { ...configuracao, toValue: valorX }),
      Animated.spring(eixoY, { ...configuracao, toValue: valorY }),
      Animated.spring(profundidade, { ...configuracao, toValue: pressionado ? 1 : 0 }),
    ]).start();
  }

  function acompanhar(evento) {
    const { locationX, locationY } = evento.nativeEvent;
    const x = Math.max(-1, Math.min(1, (locationX / largura) * 2 - 1));
    const y = Math.max(-1, Math.min(1, (locationY / altura) * 2 - 1));
    animar(x, y, true);
  }

  const inclinacaoX = eixoY.interpolate({
    inputRange: [-1, 1],
    outputRange: [`-${LIMITE}deg`, `${LIMITE}deg`],
  });
  const inclinacaoY = eixoX.interpolate({
    inputRange: [-1, 1],
    outputRange: [`${LIMITE}deg`, `-${LIMITE}deg`],
  });
  const escala = profundidade.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.985],
  });

  return (
    <View
      onLayout={(evento) => {
        setLargura(Math.max(1, evento.nativeEvent.layout.width));
        setAltura(Math.max(1, evento.nativeEvent.layout.height));
      }}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => false}
      onResponderGrant={acompanhar}
      onResponderMove={acompanhar}
      onResponderRelease={() => animar(0, 0, false)}
      onResponderTerminate={() => animar(0, 0, false)}
      {...(Platform.OS === "web"
        ? {
            onPointerMove: (evento) => {
              if (evento.nativeEvent.buttons) acompanhar(evento);
            },
            onPointerLeave: () => animar(0, 0, false),
          }
        : {})}
      accessibilityLabel={`Bem-vindo, ${nome}. Perfil: ${perfil}`}
    >
      <Animated.View
        style={[
          styles.cartao,
          {
            transform: [
              { perspective: 900 },
              { rotateX: inclinacaoX },
              { rotateY: inclinacaoY },
              { scale: escala },
            ],
          },
        ]}
      >
        <LinearGradient colors={["#1E40AF", "#2563EB"]} style={styles.conteudo}>
          <View pointerEvents="none" style={styles.circulo} />
          <Text style={styles.saudacao}>Bem-vindo de volta 👋</Text>
          <Text style={styles.nome}>{nome}</Text>
          <Text style={styles.perfil}>{perfil}</Text>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  cartao: {
    borderRadius: 20,
    marginBottom: 26,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 5,
  },
  conteudo: { padding: 22, borderRadius: 20, overflow: "hidden", minHeight: 132 },
  circulo: {
    position: "absolute",
    right: -42,
    top: -64,
    width: 175,
    height: 175,
    borderRadius: 90,
    borderWidth: 24,
    borderColor: "#FFFFFF14",
  },
  saudacao: { color: "#BFDBFE", fontSize: 14 },
  nome: { color: "#FFFFFF", fontSize: 24, fontWeight: "800", marginTop: 5 },
  perfil: { color: "#DBEAFE", marginTop: 8 },
});
