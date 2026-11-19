import { useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

export default function BotaoTema({ escuro, aoPressionar }) {
  const pressao = useRef(new Animated.Value(0)).current;

  function animar(valor) {
    Animated.spring(pressao, {
      toValue: valor,
      stiffness: 500,
      damping: 28,
      mass: 0.7,
      useNativeDriver: true,
    }).start();
  }

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel="Tema escuro"
      accessibilityState={{ checked: escuro }}
      onPress={aoPressionar}
      onPressIn={() => animar(1)}
      onPressOut={() => animar(0)}
      style={styles.area}
    >
      <View style={[styles.base, escuro && styles.baseEscura]} />
      <Animated.View
        style={[
          styles.face,
          escuro && styles.faceEscura,
          {
            transform: [
              {
                translateY: pressao.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 5],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={[styles.texto, escuro && styles.textoEscuro]}>
          {escuro ? "☀️  Ativar modo claro" : "🌙  Ativar modo escuro"}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  area: { height: 58, marginTop: 12, marginBottom: 5 },
  base: {
    ...StyleSheet.absoluteFillObject,
    top: 6,
    borderRadius: 30,
    backgroundColor: "#101B35",
  },
  baseEscura: { backgroundColor: "#2563EB" },
  face: {
    height: 52,
    borderRadius: 30,
    backgroundColor: "#3B82F6",
    alignItems: "center",
    justifyContent: "center",
  },
  faceEscura: { backgroundColor: "#E2E8F0" },
  texto: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },
  textoEscuro: { color: "#101B35" },
});
