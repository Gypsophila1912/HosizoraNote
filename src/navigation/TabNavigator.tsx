//ボトムナビ
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { TabParamList } from "@/navigation/types";
import HomeStackNavigator from "@/navigation/HomeStackNavigator";
import SettingStackNavigator from "@/navigation/SettingStackNavigator";

const Tab = createBottomTabNavigator<TabParamList>();

const icons: Record<keyof TabParamList, string> = {
  Home: "home",
  Setting: "settings",
};

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const iconName =
            `${icons[route.name]}${focused ? "" : "-outline"}` as any;
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeStackNavigator} />
      <Tab.Screen name="Setting" component={SettingStackNavigator} />
    </Tab.Navigator>
  );
}
