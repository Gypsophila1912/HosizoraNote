import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect, useCallback } from "react";
import {
  useNavigation,
  useRoute,
  RouteProp,
  useFocusEffect,
} from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HomeStackParamList } from "@/navigation/types";
import { useThought } from "@/hooks/useThought";
import {
  Node,
  updateNodeText,
  deleteNode as deleteNodeRepo,
  reparentNodeChildren,
} from "@/db/repositories/nodeRepository";
import BranchMenuDrawer from "@/components/BranchMenuDrawer";
import ChildMessageBubble from "@/components/ChildMessageBubble";
import SwipeableMessage from "@/components/SwipeableMessage";
import TagSelector from "@/components/TagSelector";
import { getAllTags, Tag } from "@/db/repositories/tagRepository";

type ChatRouteProp = RouteProp<HomeStackParamList, "Chat">;
type Nav = NativeStackNavigationProp<HomeStackParamList, "Chat">;

export default function ChatScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<ChatRouteProp>();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();

  const {
    currentThoughtId,
    title,
    changeTitle,
    resetThought,
    complete,
    nodes,
    refreshNodes,
    replyToNode,
    sendMessage,
    loadChildNodes,
    loadNodeById,
    reorderNodes,
    removeNode,
    editNode,
  } = useThought();

  // paramsを安全に取り出す
  const thoughtId = route.params?.thoughtId ?? currentThoughtId;
  const parentNodeId = route.params?.parentNodeId; // undefined means Main mode

  const isMainMode = parentNodeId == null;

  const [parentNode, setParentNode] = useState<Node | null>(null);
  const [childNodes, setChildNodes] = useState<Node[]>([]);
  const [activeThreadRootId, setActiveThreadRootId] = useState<number | null>(
    route.params?.threadRootId ?? null,
  );
  const [inputText, setInputText] = useState("");
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedTagId, setSelectedTagId] = useState<number | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          setTags(await getAllTags());
        } catch {}
        try {
          await refreshNodes();
        } catch {}
      })();
    }, [refreshNodes]),
  );

  const tagColorMap = tags.reduce<Record<number, string>>((acc, t) => {
    acc[t.id] = t.color;
    return acc;
  }, {});

  const tagNameMap = tags.reduce<Record<number, string>>((acc, t) => {
    acc[t.id] = t.name;
    return acc;
  }, {});

  const childCountMap = nodes.reduce<Record<number, number>>((acc, n) => {
    if (n.parentId != null) acc[n.parentId] = (acc[n.parentId] ?? 0) + 1;
    return acc;
  }, {});

  // For Main Mode
  const sortedRootNodes = nodes
    .filter((n) => n.parentId == null)
    .sort((a, b) => a.createdAt - b.createdAt);

  // For Branch Mode
  const sortedChildNodes = [...childNodes].sort(
    (a, b) => a.createdAt - b.createdAt,
  );

  useEffect(() => {
    if (isMainMode || thoughtId == null || parentNodeId == null) return;
    (async () => {
      const parent = await loadNodeById(parentNodeId);
      setParentNode(parent);

      if (route.params?.createNewBranch && activeThreadRootId === null) {
        setChildNodes([]);
      } else {
        const rootId = activeThreadRootId ?? parentNodeId;
        const includeStartNode = activeThreadRootId !== null;
        const children = await loadChildNodes(rootId, includeStartNode);
        setChildNodes(children);
      }
    })();
  }, [
    isMainMode,
    parentNodeId,
    thoughtId,
    route.params?.createNewBranch,
    activeThreadRootId,
    loadChildNodes,
    loadNodeById,
  ]);

  const handleSend = useCallback(async () => {
    if (!inputText.trim()) return;
    if (!isMainMode && thoughtId == null) return;

    if (isMainMode) {
      await sendMessage(inputText, undefined, selectedTagId);
    } else {
      const targetParentId =
        childNodes.length > 0
          ? childNodes[childNodes.length - 1].id
          : parentNodeId!;
      const newNode = await replyToNode(
        thoughtId!,
        targetParentId,
        inputText,
        selectedTagId,
      );

      if (newNode) {
        let rootId = activeThreadRootId;
        let isNewThreadRoot = false;
        if (route.params?.createNewBranch && activeThreadRootId === null) {
          setActiveThreadRootId(newNode.id);
          rootId = newNode.id;
          isNewThreadRoot = true;
        } else {
          rootId = rootId ?? parentNodeId;
        }

        const includeStartNode = activeThreadRootId !== null || isNewThreadRoot;
        const updated = await loadChildNodes(rootId!, includeStartNode);
        setChildNodes(updated);
      }
    }

    setInputText("");
  }, [
    isMainMode,
    inputText,
    thoughtId,
    parentNodeId,
    childNodes,
    activeThreadRootId,
    route.params?.createNewBranch,
    replyToNode,
    sendMessage,
    selectedTagId,
    loadChildNodes,
  ]);

  const handleSwipeLeft = useCallback(
    (node: Node) => {
      if (thoughtId == null) return;
      navigation.push("Chat", {
        thoughtId,
        parentNodeId: node.id,
        createNewBranch: true,
      });
    },
    [thoughtId, navigation],
  );

  const handleSelectBranch = useCallback(
    (parentNodeId: number, threadRootId?: number) => {
      if (thoughtId == null) return;
      navigation.push("Chat", { thoughtId, parentNodeId, threadRootId });
    },
    [thoughtId, navigation],
  );

  const handleEditNode = useCallback(
    async (node: Node, newText: string) => {
      if (isMainMode) {
        await editNode(node.id, newText);
      } else {
        await updateNodeText(node.id, newText);
        const rootId = activeThreadRootId ?? parentNodeId;
        const includeStartNode = activeThreadRootId !== null;
        const updated = await loadChildNodes(rootId!, includeStartNode);
        setChildNodes(updated);
        await refreshNodes();
      }
    },
    [
      isMainMode,
      editNode,
      loadChildNodes,
      parentNodeId,
      activeThreadRootId,
      refreshNodes,
    ],
  );

  const handleDeleteNode = useCallback(
    async (node: Node) => {
      if (isMainMode) {
        await removeNode(node.id);
      } else {
        await reparentNodeChildren(node.id, node.parentId);
        await deleteNodeRepo(node.id);
        const rootId = activeThreadRootId ?? parentNodeId;
        const includeStartNode = activeThreadRootId !== null;
        const updated = await loadChildNodes(rootId!, includeStartNode);
        setChildNodes(updated);
        await refreshNodes();
      }
    },
    [
      isMainMode,
      removeNode,
      loadChildNodes,
      parentNodeId,
      activeThreadRootId,
      refreshNodes,
    ],
  );

  const handleMoveUp = useCallback(
    async (node: Node) => {
      if (isMainMode) {
        const idx = sortedRootNodes.findIndex((n) => n.id === node.id);
        if (idx <= 0) return;
        await reorderNodes(sortedRootNodes, idx, idx - 1);
      } else {
        const idx = sortedChildNodes.findIndex((n) => n.id === node.id);
        if (idx <= 0) return;
        const reordered = await reorderNodes(sortedChildNodes, idx, idx - 1);
        setChildNodes(reordered);
      }
    },
    [isMainMode, sortedRootNodes, sortedChildNodes, reorderNodes],
  );

  const handleMoveDown = useCallback(
    async (node: Node) => {
      if (isMainMode) {
        const idx = sortedRootNodes.findIndex((n) => n.id === node.id);
        if (idx < 0 || idx >= sortedRootNodes.length - 1) return;
        await reorderNodes(sortedRootNodes, idx, idx + 1);
      } else {
        const idx = sortedChildNodes.findIndex((n) => n.id === node.id);
        if (idx < 0 || idx >= sortedChildNodes.length - 1) return;
        const reordered = await reorderNodes(sortedChildNodes, idx, idx + 1);
        setChildNodes(reordered);
      }
    },
    [isMainMode, sortedRootNodes, sortedChildNodes, reorderNodes],
  );

  const handleReset = () => {
    Alert.alert("リセット", "入力内容をすべて削除しますか？", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "削除",
        style: "destructive",
        onPress: async () => {
          await resetThought();
          if (!isMainMode) {
            navigation.navigate("Chat" as any, { thoughtId });
          }
        },
      },
    ]);
  };

  const handleComplete = async () => {
    await complete();
    navigation.navigate("ThoughtSelectTab" as any);
  };

  // Branch Mode expects thoughtId and parentNodeId to exist.
  // Main Mode can have thoughtId == null if it's a completely new, unsaved thought.
  if (!isMainMode && (thoughtId == null || parentNodeId == null)) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>画面の読み込みに失敗しました。</Text>
          <TouchableOpacity
            style={styles.backButtonMain}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>戻る</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const renderItemMain = ({ item, index }: { item: Node; index: number }) => {
    const displayIndex = sortedRootNodes.length - 1 - index;
    return (
      <SwipeableMessage
        item={item}
        childCount={childCountMap[item.id] ?? 0}
        tagColor={item.tagId ? tagColorMap[item.tagId] : null}
        tagName={item.tagId ? tagNameMap[item.tagId] : null}
        onSwipeLeft={handleSwipeLeft}
        onEdit={handleEditNode}
        onDelete={handleDeleteNode}
        onMoveUp={handleMoveUp}
        onMoveDown={handleMoveDown}
        canMoveUp={displayIndex > 0}
        canMoveDown={displayIndex < sortedRootNodes.length - 1}
      />
    );
  };

  const renderItemBranch = ({ item, index }: { item: Node; index: number }) => {
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
  };

  return (
    <>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior="padding"
          keyboardVerticalOffset={
            Platform.OS === "ios"
              ? headerHeight + insets.top
              : insets.bottom - 17
          }
        >
          {/* 全体ヘッダー (タイトル、リセット、完了) */}
          <View style={styles.globalHeader}>
            <TouchableOpacity
              onPress={() => setMenuVisible(true)}
              style={styles.hamburgerButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <View style={styles.hamburgerLine} />
              <View style={styles.hamburgerLine} />
              <View style={styles.hamburgerLine} />
            </TouchableOpacity>

            <TextInput
              style={styles.titleInput}
              value={title}
              onChangeText={changeTitle}
              placeholder="タイトルを入力..."
              placeholderTextColor="#475569"
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

          {/* 分岐先ヘッダー (戻るボタン、分岐元表示) */}
          {!isMainMode && (
            <View style={styles.originRow}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backButton}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.backIcon}>‹</Text>
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
          )}

          <FlatList
            data={
              isMainMode
                ? [...sortedRootNodes].reverse()
                : [...sortedChildNodes].reverse()
            }
            keyExtractor={(item) => item.id.toString()}
            renderItem={isMainMode ? renderItemMain : renderItemBranch}
            contentContainerStyle={styles.messageList}
            inverted
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>思考の渦を吐き出しましょう</Text>
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
              placeholder="メッセージを入力..."
              multiline
              onFocus={() => setKeyboardVisible(true)}
              onBlur={() => setKeyboardVisible(false)}
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
        allNodes={nodes}
        onSelectBranch={handleSelectBranch}
      />
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#080c18" },
  container: { flex: 1 },
  globalHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0d1225",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(167,139,250,0.2)",
    gap: 8,
  },
  hamburgerButton: { justifyContent: "center", paddingRight: 4 },
  hamburgerLine: {
    width: 20,
    height: 2,
    backgroundColor: "#a78bfa",
    borderRadius: 1,
    marginVertical: 2,
  },
  titleInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#e2e8f0",
    paddingVertical: 4,
  },
  resetButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  resetButtonText: { fontSize: 13, color: "#64748b" },
  completeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#a78bfa",
  },
  completeButtonText: { fontSize: 13, color: "#fff", fontWeight: "700" },
  originRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#0d1225",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(167,139,250,0.1)",
  },
  backButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginRight: 8,
  },
  backIcon: {
    fontSize: 28,
    color: "#a78bfa",
    lineHeight: 32,
  },
  originContainer: {
    flex: 1,
    backgroundColor: "rgba(167,139,250,0.05)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.1)",
  },
  originLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#a78bfa",
    marginBottom: 2,
  },
  originText: {
    fontSize: 13,
    color: "#94a3b8",
    lineHeight: 18,
  },
  messageList: { padding: 16, gap: 12 },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
  },
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
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    color: "#ef4444",
    marginBottom: 16,
  },
  backButtonMain: {
    padding: 12,
    backgroundColor: "#334155",
    borderRadius: 8,
  },
  backButtonText: { color: "#fff" },
});
