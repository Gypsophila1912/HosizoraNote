import "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AppNavigator from "@/navigation/AppNavigator";
import { DrizzleProvider } from "@/provider/DrizzleProvider";

export default function App() {
  return (
    <DrizzleProvider>
      <SafeAreaProvider>
        <AppNavigator />
      </SafeAreaProvider>
    </DrizzleProvider>
  );
}
