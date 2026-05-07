import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ThoughtSelectStackParamList } from "@/navigation/types";
import ThoughtSelectScreen from "@/screens/Thoughtselectscreen";
import ThoughtViewScreen from "@/screens/Thoughtviewscreen";

const Stack = createNativeStackNavigator<ThoughtSelectStackParamList>();

export default function ThoughtSelectStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ThoughtSelect"
        component={ThoughtSelectScreen}
        options={{ title: "きろく" }}
      />
      <Stack.Screen
        name="ThoughtView"
        component={ThoughtViewScreen}
        options={{ title: "内容" }}
      />
    </Stack.Navigator>
  );
}
