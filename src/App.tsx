import { StatusBar } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import AppNavigator from "@/navigation/AppNavigator";

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#080c18" />
      <SafeAreaView
        style={{ flex: 1, backgroundColor: "#080c18" }}
        edges={["top"]}
      >
        <AppNavigator />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
