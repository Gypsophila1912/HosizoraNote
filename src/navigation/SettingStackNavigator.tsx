//SETTING画面以下の画面遷移
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SettingStackParamList } from "@/navigation/types";
import SettingScreen from "@/screens/SettingScreen";

const Stack = createNativeStackNavigator<SettingStackParamList>();

export default function SettingStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Setting" component={SettingScreen} />
    </Stack.Navigator>
  );
}
