//ホーム画面以下の画面遷移。一番上にあるものが最初に表示される
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { HomeStackParamList } from "@/navigation/types";
import ChatScreen from "@/screens/ChatScreen";

const Stack = createNativeStackNavigator<HomeStackParamList>();

export default function HomeStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Chat" component={ChatScreen} />
    </Stack.Navigator>
  );
}
