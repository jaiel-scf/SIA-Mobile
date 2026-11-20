import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { View } from "react-native";
import { useState } from "react";

import MenuInferior from "./components/MenuInferior";

import Introducao from "./components/Introducao";
import Login from "./components/Login";
import RedefinirSenha from "./components/RedefinirSenha";
import Inicio from "./components/Inicio";
import Estoque from "./components/Estoque";
import Entradas from "./components/Entradas";
import Saidas from "./components/Saidas";
import Usuarios from "./components/Usuarios";

const Stack = createNativeStackNavigator();

function TelaComMenu({ navigation, usuario, telaAtual, escuro, children }) {
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>{children}</View>
      <MenuInferior
        telaAtual={telaAtual}
        escuro={escuro}
        usuario={usuario}
        navegar={(tela) => {
          if ((tela === "Entradas" || tela === "Usuarios") && String(usuario?.perfil ?? "").toLowerCase() !== "admin") {
            return;
          }
          navigation.navigate(tela, { usuario });
        }}
      />
    </View>
  );
}

export default function App() {
  const [escuro, setEscuro] = useState(false);

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Introducao"
        screenOptions={{
          headerShown: false,
          animation: "none",
        }}
      >
        {/* Introdução animada */}
        <Stack.Screen name="Introducao">
          {({ navigation }) => <Introducao finalizar={() => navigation.replace("Login")} />}
        </Stack.Screen>

        {/* Login */}
        <Stack.Screen name="Login">
          {({ navigation }) => (
            <Login
              entrar={(dadosUsuario) => {
                // Primeiro acesso obrigatório
                if (dadosUsuario.primeiroAcesso === true) {
                  navigation.replace("RedefinirSenha", {
                    usuario: dadosUsuario,
                  });
                  return;
                }

                // Login normal
                navigation.replace("Inicio", {
                  usuario: dadosUsuario,
                });
              }}
            />
          )}
        </Stack.Screen>

        {/* Primeiro acesso */}
        <Stack.Screen name="RedefinirSenha">
          {({ navigation, route }) => (
            <RedefinirSenha
              usuario={route.params?.usuario}
              concluir={(usuarioAtualizado) => {
                navigation.replace("Inicio", {
                  usuario: usuarioAtualizado,
                });
              }}
              voltarLogin={() => {
                navigation.replace("Login");
              }}
            />
          )}
        </Stack.Screen>

        {/* Tela inicial */}
        <Stack.Screen name="Inicio">
          {({ navigation, route }) => {
            const usuario = route.params?.usuario;

            return (
              <TelaComMenu navigation={navigation} usuario={usuario} telaAtual="Inicio" escuro={escuro}>
                <Inicio
                usuario={usuario}
                escuro={escuro}
                alternarTema={() => setEscuro((anterior) => !anterior)}
                irParaEstoque={() =>
                  navigation.navigate("Estoque", {
                    usuario,
                  })
                }
                irParaEntradas={() => {
                  if (usuario?.perfil === "admin") {
                    navigation.navigate("Entradas", { usuario });
                  }
                }}
                irParaSaidas={() =>
                  navigation.navigate("Saidas", {
                    usuario,
                  })
                }
                irParaUsuarios={() => {
                  if (usuario?.perfil === "admin") {
                    navigation.navigate("Usuarios", { usuario });
                  }
                }}
                voltarParaLogin={() => navigation.replace("Login")}
                />
              </TelaComMenu>
            );
          }}
        </Stack.Screen>

        {/* Estoque */}
        <Stack.Screen name="Estoque">
          {({ navigation, route }) => (
            <TelaComMenu navigation={navigation} usuario={route.params?.usuario} telaAtual="Estoque" escuro={escuro}>
              <Estoque usuario={route.params?.usuario} voltar={() => navigation.goBack()} />
            </TelaComMenu>
          )}
        </Stack.Screen>

        {/* Entradas */}
        <Stack.Screen name="Entradas">
          {({ navigation, route }) => (
            <TelaComMenu navigation={navigation} usuario={route.params?.usuario} telaAtual="Entradas" escuro={escuro}>
              <Entradas usuario={route.params?.usuario} voltar={() => navigation.goBack()} />
            </TelaComMenu>
          )}
        </Stack.Screen>

        {/* Requisições */}
        <Stack.Screen name="Saidas">
          {({ navigation, route }) => (
            <TelaComMenu navigation={navigation} usuario={route.params?.usuario} telaAtual="Saidas" escuro={escuro}>
              <Saidas usuario={route.params?.usuario} voltar={() => navigation.goBack()} escuro={escuro} />
            </TelaComMenu>
          )}
        </Stack.Screen>

        {/* Usuários - somente administrador */}
        <Stack.Screen name="Usuarios">
          {({ navigation, route }) => {
            const usuario = route.params?.usuario;
            if (String(usuario?.perfil ?? "").toLowerCase() !== "admin") {
              return <Inicio usuario={usuario} voltarParaLogin={() => navigation.replace("Login")} escuro={escuro} alternarTema={() => setEscuro((anterior) => !anterior)} />;
            }
            return (
              <TelaComMenu navigation={navigation} usuario={usuario} telaAtual="Usuarios" escuro={escuro}>
                <Usuarios usuario={usuario} voltar={() => navigation.goBack()} escuro={escuro} />
              </TelaComMenu>
            );
          }}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
