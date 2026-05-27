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
import { useNavigation, useRoute, RouteProp, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { HomeStackParamList } from "@/navigation/types";
import { useThought } from "@/hooks/useThought";
import {
  Node,
  getNodesByThoughtId,
  updateNodeText,
  deleteNode as deleteNodeRepo,
} from "@/db/repositories/nodeRepository";
import BranchMenuDrawer from "@/components/BranchMenuDrawer";
import ChildMessageBubble from "@/components/ChildMessageBubble";
import TagSelector from "@/components/TagSelector";
import { getAllTags, Tag } from "@/db/repositories/tagRepository";

type DetailRouteProp = RouteProp<HomeStackParamList, "Detail">;
type Nav = NativeStackNavigationProp<HomeStackParamList, "Detail">;

export default function DetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<DetailRouteProp>();

  // paramsを安全に取り出す
  const thoughtId = route.params?.thoughtId;
  const parentNodeId = route.params?.parentNodeId;

  const { replyToNode, loadChildNodes, loadNodeById, reorderNodes } = useThought();


  const [parentNode, setParentNode] = useState<Node | null>(null);
  const [childNodes, setChildNodes] = useState<Node[]>([]);
  const [allNodes, setAllNodes] = useState<Node[]>([]);
  const [inputText, setInputText] = useState("");
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedTagId, setSelectedTagId] = useState<number | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try { setTags(await getAllTags()); } catch {}
      })();
    }, []),
  );

  const tagColorMap = tags.reduce<Record<number, string>>((acc, t) => {
    acc[t.id] = t.color;
    return acc;
  }, {});

  // order で昇順ソート
  const sortedChildNodes = [...childNodes].sort(
    (a, b) => a.createdAt - b.createdAt,
  );

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
    const updated = await replyToNode(thoughtId, parentNodeId, inputText, selectedTagId);
    setChildNodes(updated);
    const all = await getNodesByThoughtId(thoughtId);
    setAllNodes(all);
    setInputText("");
    setSelectedTagId(null);
  }, [inputText, thoughtId, parentNodeId, replyToNode, selectedTagId]);

  const handleSwipeLeft = useCallback(
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

  const handleEditNode = useCallback(
    async (node: Node, newText: string) => {
      await updateNodeText(node.id, newText);
      const updated = await loadChildNodes(parentNodeId!);
      setChildNodes(updated);
    },
    [loadChildNodes, parentNodeId],
  );

  const handleDeleteNode = useCallback(
    async (node: Node) => {
      await deleteNodeRepo(node.id);
      const updated = await loadChildNodes(parentNodeId!);
      setChildNodes(updated);
    },
    [loadChildNodes, parentNodeId],
  );

  const handleMoveUp = useCallback(
    async (node: Node) => {
      const idx = sortedChildNodes.findIndex((n) => n.id === node.id);
      if (idx <= 0) return;
      const reordered = await reorderNodes(sortedChildNodes, idx, idx - 1);
      setChildNodes(reordered);
    },
    [sortedChildNodes, reorderNodes],
  );

  const handleMoveDown = useCallback(
    async (node: Node) => {
      const idx = sortedChildNodes.findIndex((n) => n.id === node.id);
      if (idx < 0 || idx >= sortedChildNodes.length - 1) return;
      const reordered = await reorderNodes(sortedChildNodes, idx, idx + 1);
      setChildNodes(reordered);
    },
    [sortedChildNodes, reorderNodes],
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
            data={[...sortedChildNodes].reverse()}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item, index }) => {
              const displayIndex = sortedChildNodes.length - 1 - index;
              return (
                <ChildMessageBubble
                  item={item}
                  tagColor={item.tagId ? tagColorMap[item.tagId] : null}
                  onSwipeLeft={handleSwipeLeft}
                  onEdit={handleEditNode}
                  onDelete={handleDeleteNode}
                  onMoveUp={handleMoveUp}
                  onMoveDown={handleMoveDown}
                  canMoveUp={displayIndex > 0}
                  canMoveDown={displayIndex < sortedChildNodes.length - 1}
                />
              );
            }}
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

          <TagSelector
            selectedTagId={selectedTagId}
            onSelectTag={setSelectedTagId}
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
  safeArea: { flex: 1, backgroundColor: "#080c18" },
  container: { flex: 1 },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    padding: 24,
  },
  errorText: { fontSize: 15, color: "#64748b", textAlign: "center" },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#a78bfa",
  },
  backButtonText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  originRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0d1225",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(167,139,250,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  hamburgerButton: { justifyContent: "center", flexShrink: 0 },
  hamburgerLine: {
    width: 20,
    height: 2,
    backgroundColor: "#a78bfa",
    borderRadius: 1,
    marginVertical: 2,
  },
  originContainer: {
    flex: 1,
    backgroundColor: "rgba(167,139,250,0.1)",
    borderLeftWidth: 3,
    borderLeftColor: "#a78bfa",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  originLabel: {
    fontSize: 11,
    color: "#a78bfa",
    fontWeight: "700",
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  originText: { fontSize: 14, color: "#e2e8f0", lineHeight: 20 },
  messageList: { padding: 16, gap: 8 },
  emptyContainer: { alignItems: "center", paddingVertical: 48 },
  emptyText: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 22,
  },
  inputContainer: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#0d1225",
    borderTopWidth: 1,
    borderTopColor: "rgba(167,139,250,0.15)",
    gap: 8,
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.25)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
    maxHeight: 100,
    backgroundColor: "rgba(255,255,255,0.05)",
    color: "#e2e8f0",
  },
  sendButton: {
    backgroundColor: "#a78bfa",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  sendButtonText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
