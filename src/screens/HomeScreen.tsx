import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { TabParamList } from "@/navigation/types";
import { useThought } from "@/hooks/useThought";
import { Node } from "@/db/repositories/nodeRepository";

type Nav = BottomTabNavigationProp<TabParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { title, nodes, changeTitle, sendMessage, complete, resetThought } =
    useThought();
  const [inputText, setInputText] = useState("");

  const handleSend = async () => {
    if (!inputText.trim()) return;
    await sendMessage(inputText);
    setInputText("");
  };

  const handleComplete = async () => {
    await complete();
    navigation.navigate("Setting"); // 一覧画面ができたら変更
  };

  const handleReset = () => {
    Alert.alert("リセット", "入力内容をすべて削除しますか？", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "削除",
        style: "destructive",
        onPress: async () => await resetThought(),
      },
    ]);
  };

  const renderItem = ({ item }: { item: Node }) => (
    <View style={styles.messageBubble}>
      <Text style={styles.messageText}>{item.text}</Text>
      <Text style={styles.messageTime}>
        {new Date(item.createdAt).toLocaleTimeString("ja-JP", {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 85}
    >
      {/* ヘッダー */}
      <View style={styles.header}>
        <TextInput
          style={styles.titleInput}
          value={title}
          onChangeText={changeTitle}
          placeholder="タイトルを入力..."
          placeholderTextColor="#9E9E9E"
        />
        <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
          <Text style={styles.resetButtonText}>リセット</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.completeButton}
          onPress={handleComplete}
        >
          <Text style={styles.completeButtonText}>完了</Text>
        </TouchableOpacity>
      </View>

      {/* メッセージ一覧 */}
      <FlatList
        data={[...nodes].reverse()}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.messageList}
        inverted
      />

      {/* 入力欄 */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="メッセージを入力..."
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
          <Text style={styles.sendButtonText}>送信</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    gap: 8,
  },
  titleInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#212121",
    paddingVertical: 4,
  },
  resetButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  resetButtonText: {
    fontSize: 13,
    color: "#9E9E9E",
  },
  completeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#5C6BC0",
  },
  completeButtonText: {
    fontSize: 13,
    color: "#fff",
    fontWeight: "700",
  },
  messageList: {
    padding: 16,
    gap: 8,
  },
  messageBubble: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    maxWidth: "80%",
    alignSelf: "flex-end",
    elevation: 2,
  },
  messageText: {
    fontSize: 16,
    color: "#212121",
  },
  messageTime: {
    fontSize: 11,
    color: "#9E9E9E",
    marginTop: 4,
    alignSelf: "flex-end",
  },
  inputContainer: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    gap: 8,
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
    maxHeight: 100,
    backgroundColor: "#f5f5f5",
  },
  sendButton: {
    backgroundColor: "#5C6BC0",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  sendButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
});
