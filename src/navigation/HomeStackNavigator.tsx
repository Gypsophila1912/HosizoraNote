//ホーム画面以下の画面遷移。一番上にあるものが最初に表示される
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { HomeStackParamList } from "@/navigation/types";
import HomeScreen from "@/screens/HomeScreen";
import DetailScreen from "@/screens/DetailScreen";

const Stack = createNativeStackNavigator<HomeStackParamList>();

export default function HomeStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Detail" component={DetailScreen} />
    </Stack.Navigator>
  );
}
