//ナビゲーションのエントリーポイント
import { NavigationContainer } from "@react-navigation/native";
import TabNavigator from "@/navigation/TabNavigator";

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <TabNavigator />
    </NavigationContainer>
  );
}
