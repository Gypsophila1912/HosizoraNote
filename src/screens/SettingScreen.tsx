import { View, Text, Button } from "react-native";
import { useNavigation } from "@react-navigation/native";

export default function SettingScreen() {
  const navigation = useNavigation();

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text>Setting画面</Text>
      <Button title="戻る" onPress={() => navigation.goBack()} />
    </View>
  );
}
