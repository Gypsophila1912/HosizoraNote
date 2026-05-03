import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from "react-native";
import { useState, useEffect, useCallback } from "react";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { HomeStackParamList } from "@/navigation/types";
import { useThought } from "@/hooks/useThought";
import { Node, getNodesByThoughtId } from "@/db/repositories/nodeRepository";
import BranchMenuDrawer from "@/components/BranchMenuDrawer";

type DetailRouteProp = RouteProp<HomeStackParamList, "Detail">;
type Nav = NativeStackNavigationProp<HomeStackParamList, "Detail">;

export default function DetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<DetailRouteProp>();

  // paramsを安全に取り出す
  const thoughtId = route.params?.thoughtId;
  const parentNodeId = route.params?.parentNodeId;

  const { replyToNode, loadChildNodes, loadNodeById } = useThought();

  const [parentNode, setParentNode] = useState<Node | null>(null);
  const [childNodes, setChildNodes] = useState<Node[]>([]);
  const [allNodes, setAllNodes] = useState<Node[]>([]);
  const [inputText, setInputText] = useState("");
  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    if (thoughtId == null || parentNodeId == null) return;
    (async () => {
      const [parent, children, all] = await Promise.all([
        loadNodeById(parentNodeId),
        loadChildNodes(parentNodeId),
        getNodesByThoughtId(thoughtId),
      ]);
      setParentNode(parent);
      setChildNodes(children);
      setAllNodes(all);
    })();
  }, [parentNodeId, thoughtId]);

  const handleSend = useCallback(async () => {
    if (!inputText.trim() || thoughtId == null || parentNodeId == null) return;
    const updated = await replyToNode(thoughtId, parentNodeId, inputText);
    setChildNodes(updated);
    const all = await getNodesByThoughtId(thoughtId);
    setAllNodes(all);
    setInputText("");
  }, [inputText, thoughtId, parentNodeId, replyToNode]);

  const handleBranch = useCallback(
    (node: Node) => {
      if (thoughtId == null) return;
      navigation.push("Detail", { thoughtId, parentNodeId: node.id });
    },
    [thoughtId, navigation],
  );

  const handleSelectBranch = useCallback(
    (nodeId: number) => {
      if (thoughtId == null) return;
      navigation.push("Detail", { thoughtId, parentNodeId: nodeId });
    },
    [thoughtId, navigation],
  );

  // paramsが取れない場合のフォールバック
  if (thoughtId == null || parentNodeId == null) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>画面の読み込みに失敗しました。</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>戻る</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const renderChild = ({ item }: { item: Node }) => (
    <TouchableOpacity
      style={styles.messageBubble}
      onLongPress={() => handleBranch(item)}
      delayLongPress={400}
      activeOpacity={0.8}
    >
      <Text style={styles.messageText}>{item.text}</Text>
      <View style={styles.messageMeta}>
        <Text style={styles.messageTime}>
          {new Date(item.createdAt).toLocaleTimeString("ja-JP", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
        <Text style={styles.longPressHint}>長押しで分岐</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 85}
        >
          {/* ── 分岐元エリア（ハンバーガー付き） ── */}
          <View style={styles.originRow}>
            <TouchableOpacity
              onPress={() => setMenuVisible(true)}
              style={styles.hamburgerButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <View style={styles.hamburgerLine} />
              <View style={styles.hamburgerLine} />
              <View style={styles.hamburgerLine} />
            </TouchableOpacity>

            <View style={styles.originContainer}>
              <Text style={styles.originLabel}>分岐元</Text>
              <Text
                style={styles.originText}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {parentNode?.text ?? ""}
              </Text>
            </View>
          </View>

          <FlatList
            data={[...childNodes].reverse()}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderChild}
            contentContainerStyle={styles.messageList}
            inverted
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  まだ返信がありません。{"\n"}最初のメッセージを送信してください
                </Text>
              </View>
            }
          />

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="返信を入力..."
              multiline
            />
            <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
              <Text style={styles.sendButtonText}>送信</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <BranchMenuDrawer
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        allNodes={allNodes}
        onSelectBranch={handleSelectBranch}
      />
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f5f5f5" },
  container: { flex: 1 },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    padding: 24,
  },
  errorText: { fontSize: 15, color: "#9E9E9E", textAlign: "center" },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#5C6BC0",
  },
  backButtonText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  originRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  hamburgerButton: {
    justifyContent: "center",
    flexShrink: 0,
  },
  hamburgerLine: {
    width: 20,
    height: 2,
    backgroundColor: "#5C6BC0",
    borderRadius: 1,
    marginVertical: 2,
  },
  originContainer: {
    flex: 1,
    backgroundColor: "#EDE7F6",
    borderLeftWidth: 3,
    borderLeftColor: "#5C6BC0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  originLabel: {
    fontSize: 11,
    color: "#5C6BC0",
    fontWeight: "700",
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  originText: { fontSize: 14, color: "#212121", lineHeight: 20 },
  messageList: { padding: 16, gap: 8 },
  messageBubble: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    maxWidth: "80%",
    alignSelf: "flex-end",
    elevation: 2,
    marginBottom: 8,
  },
  messageText: { fontSize: 16, color: "#212121" },
  messageMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 4,
    gap: 8,
  },
  messageTime: { fontSize: 11, color: "#9E9E9E" },
  longPressHint: { fontSize: 10, color: "#BDBDBD" },
  emptyContainer: { alignItems: "center", paddingVertical: 48 },
  emptyText: {
    fontSize: 14,
    color: "#9E9E9E",
    textAlign: "center",
    lineHeight: 22,
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
  sendButtonText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
