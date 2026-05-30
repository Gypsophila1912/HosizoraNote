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
  HomeTab: { focused: "home", outline: "home-outline" },
  ThoughtSelectTab: { focused: "calendar", outline: "calendar-outline" },
  SettingTab: { focused: "person", outline: "person-outline" },
};

const LABELS: Record<keyof TabParamList, string> = {
  HomeTab: "ホーム",
  ThoughtSelectTab: "きろく",
  SettingTab: "マイページ",
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
        tabBarActiveTintColor: "#22d3ee",
        tabBarInactiveTintColor: "#64748b",
        tabBarStyle: {
          backgroundColor: "#0d1225",
          borderTopColor: "rgba(34,211,238,0.15)",
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeStackNavigator} />
      <Tab.Screen
        name="ThoughtSelectTab"
        component={ThoughtSelectStackNavigator}
      />
      <Tab.Screen name="SettingTab" component={SettingStackNavigator} />
    </Tab.Navigator>
  );
}
