import { View, StatusBar } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AppNavigator from "@/navigation/AppNavigator";
import StarryBackground from "@/components/StarryBackground";

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#080c18" />
      <View style={{ flex: 1, backgroundColor: "#080c18" }}>
        <StarryBackground />
        <AppNavigator />
      </View>
    </SafeAreaProvider>
  );
}
