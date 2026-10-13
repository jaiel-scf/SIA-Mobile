import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import Introducao from "./components/Introducao";
import Login from "./components/Login";
import RedefinirSenha from "./components/RedefinirSenha";
import Inicio from "./components/Inicio";
import Estoque from "./components/Estoque";
import Entradas from "./components/Entradas";
import Saidas from "./components/Saidas";
import Usuarios from "./components/Usuarios";

const Stack = createNativeStackNavigator();

export default function App() {
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
              <Inicio
                usuario={usuario}
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
            );
          }}
        </Stack.Screen>

        {/* Estoque */}
        <Stack.Screen name="Estoque">
          {({ navigation, route }) => <Estoque usuario={route.params?.usuario} voltar={() => navigation.goBack()} />}
        </Stack.Screen>

        {/* Entradas */}
        <Stack.Screen name="Entradas">
          {({ navigation, route }) => <Entradas usuario={route.params?.usuario} voltar={() => navigation.goBack()} />}
        </Stack.Screen>

        {/* Requisições */}
        <Stack.Screen name="Saidas">
          {({ navigation, route }) => <Saidas usuario={route.params?.usuario} voltar={() => navigation.goBack()} />}
        </Stack.Screen>

        {/* Usuários */}
        <Stack.Screen name="Usuarios">
          {({ navigation, route }) => <Usuarios usuario={route.params?.usuario} voltar={() => navigation.goBack()} />}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
