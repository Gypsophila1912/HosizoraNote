// ナビゲーションのエントリーポイント
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: 'transparent',
  },
};
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/types";
import LoginScreen from "@/screens/LoginScreen";
import TabNavigator from "@/navigation/TabNavigator";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Main" component={TabNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
