import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { TabParamList } from "@/navigation/types";
import HomeStackNavigator from "@/navigation/HomeStackNavigator";
import SettingStackNavigator from "@/navigation/SettingStackNavigator";
import ThoughtSelectStackNavigator from "@/navigation/ThoughtSelectStackNavigator";

const Tab = createBottomTabNavigator<TabParamList>();

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

const ICONS: Record<
  keyof TabParamList,
  { focused: IoniconsName; outline: IoniconsName }
> = {
  Home: { focused: "home", outline: "home-outline" },
  ThoughtSelect: { focused: "calendar", outline: "calendar-outline" },
  Setting: { focused: "settings", outline: "settings-outline" },
};

const LABELS: Record<keyof TabParamList, string> = {
  Home: "ホーム",
  ThoughtSelect: "きろく",
  Setting: "設定",
};

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const icon = ICONS[route.name];
          return (
            <Ionicons
              name={focused ? icon.focused : icon.outline}
              size={size}
              color={color}
            />
          );
        },
        tabBarLabel: LABELS[route.name],
        headerShown: false,
        tabBarActiveTintColor: "#a78bfa",
        tabBarInactiveTintColor: "#64748b",
        tabBarStyle: {
          backgroundColor: "#0d1225",
          borderTopColor: "rgba(167,139,250,0.15)",
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStackNavigator} />
      <Tab.Screen
        name="ThoughtSelect"
        component={ThoughtSelectStackNavigator}
      />
      <Tab.Screen name="Setting" component={SettingStackNavigator} />
    </Tab.Navigator>
  );
}
