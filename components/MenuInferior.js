import { useEffect, useRef, useState } from "react";
import { Animated, Keyboard, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import BlocksIcon from "../assets/icons/blocks.svg";
import ClipboardListIcon from "../assets/icons/clipboard-list.svg";
import PackagePlusIcon from "../assets/icons/package-plus.svg";
import SendIcon from "../assets/icons/send.svg";

const ITENS = [
  { tela: "Inicio", titulo: "Início", Icone: BlocksIcon },
  { tela: "Estoque", titulo: "Estoque", Icone: ClipboardListIcon },
  { tela: "Entradas", titulo: "Entradas", Icone: PackagePlusIcon },
  { tela: "Saidas", titulo: "Saídas", Icone: SendIcon },
];

export default function MenuInferior({ telaAtual, usuario, navegar }) {
  const insets = useSafeAreaInsets();
  const administrador = String(usuario?.perfil ?? "").toLowerCase() === "admin";
  const itens = ITENS.filter((item) => administrador || item.tela !== "Entradas");
  const indice = Math.max(0, itens.findIndex((item) => item.tela === telaAtual));

  const [largura, setLargura] = useState(0);
  const [tecladoAberto, setTecladoAberto] = useState(false);
  const deslocamento = useRef(new Animated.Value(0)).current;
  const larguraIndicador = largura > 0 ? (largura - 10) / itens.length : 0;

  useEffect(() => {
    const abrir = Keyboard.addListener("keyboardDidShow", () => setTecladoAberto(true));
    const fechar = Keyboard.addListener("keyboardDidHide", () => setTecladoAberto(false));
    return () => {
      abrir.remove();
      fechar.remove();
    };
  }, []);

  useEffect(() => {
    if (!larguraIndicador) return;
    Animated.spring(deslocamento, {
      toValue: indice * larguraIndicador,
      stiffness: 800,
      damping: 60,
      mass: 1,
      useNativeDriver: true,
    }).start();
  }, [deslocamento, indice, larguraIndicador]);

  if (tecladoAberto) return null;

  return (
    <View style={[styles.area, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.menu} onLayout={(evento) => setLargura(evento.nativeEvent.layout.width)}>
        {larguraIndicador > 0 && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.indicador,
              {
                width: larguraIndicador,
                transform: [{ translateX: deslocamento }],
              },
            ]}
          />
        )}
        {itens.map(({ tela, titulo, Icone }) => {
          const ativo = telaAtual === tela;
          return (
            <Pressable
              key={tela}
              style={styles.botao}
              onPress={() => {
                if (!ativo) navegar(tela);
              }}
              accessibilityRole="tab"
              accessibilityLabel={titulo}
              accessibilityState={{ selected: ativo }}
            >
              <Icone width={21} height={21} color={ativo ? "#FFFFFF" : "#CBD5E1"} />
              <Text style={[styles.rotulo, ativo && styles.rotuloAtivo]}>{titulo}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  area: {
    paddingTop: 8,
    paddingHorizontal: 16,
    backgroundColor: "#F4F7FC",
  },
  menu: {
    flexDirection: "row",
    backgroundColor: "#101B35",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FFFFFF26",
    padding: 5,
    minHeight: 66,
    overflow: "hidden",
  },
  indicador: {
    position: "absolute",
    left: 5,
    top: 5,
    bottom: 5,
    backgroundColor: "#3B82F6",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FFFFFF40",
  },
  botao: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    zIndex: 1,
    minWidth: 0,
  },
  rotulo: {
    fontSize: 11,
    fontWeight: "600",
    color: "#CBD5E1",
  },
  rotuloAtivo: {
    color: "#FFFFFF",
  },
});
