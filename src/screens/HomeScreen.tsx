import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
} from "react-native";
import { useState, useCallback } from "react";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { HomeStackParamList, TabParamList } from "@/navigation/types";
import { useThought } from "@/hooks/useThought";
import { Node } from "@/db/repositories/nodeRepository";
import BranchMenuDrawer from "@/components/BranchMenuDrawer";
import SwipeableMessage from "@/components/SwipeableMessage";
import TagSelector from "@/components/TagSelector";
import { getAllTags, Tag } from "@/db/repositories/tagRepository";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Nav = NativeStackNavigationProp<HomeStackParamList, "Home"> &
  BottomTabNavigationProp<TabParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const {
    title,
    nodes,
    currentThoughtId,
    changeTitle,
    sendMessage,
    complete,
    resetThought,
    editNode,
    removeNode,
    reorderNodes,
    refreshNodes,
  } = useThought();
  const [inputText, setInputText] = useState("");
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedTagId, setSelectedTagId] = useState<number | null>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try { setTags(await getAllTags()); } catch {}
        try { await refreshNodes(); } catch {}
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

  const sortedRootNodes = nodes
    .filter((n) => n.parentId == null)
    .sort((a, b) => a.createdAt - b.createdAt);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    await sendMessage(inputText, undefined, selectedTagId);
    setInputText("");
  };

  const handleComplete = async () => {
    await complete();
    // 完了後にきろくタブへ遷移
    navigation.navigate("ThoughtSelectTab");
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

  const handleSwipeLeft = useCallback(
    (node: Node) => {
      if (!currentThoughtId) return;
      navigation.push("Detail", {
        thoughtId: currentThoughtId,
        parentNodeId: node.id,
        createNewBranch: true,
      });
    },
    [currentThoughtId, navigation],
  );

  const handleSelectBranch = useCallback(
    (parentNodeId: number, threadRootId?: number) => {
      if (!currentThoughtId) return;
      navigation.push("Detail", {
        thoughtId: currentThoughtId,
        parentNodeId,
        threadRootId,
      });
    },
    [currentThoughtId, navigation],
  );

  const handleEditNode = useCallback(
    async (node: Node, newText: string) => {
      await editNode(node.id, newText);
    },
    [editNode],
  );

  const handleDeleteNode = useCallback(
    async (node: Node) => {
      await removeNode(node.id);
    },
    [removeNode],
  );

  const handleMoveUp = useCallback(
    async (node: Node) => {
      const idx = sortedRootNodes.findIndex((n) => n.id === node.id);
      if (idx <= 0) return;
      await reorderNodes(sortedRootNodes, idx, idx - 1);
    },
    [sortedRootNodes, reorderNodes],
  );

  const handleMoveDown = useCallback(
    async (node: Node) => {
      const idx = sortedRootNodes.findIndex((n) => n.id === node.id);
      if (idx < 0 || idx >= sortedRootNodes.length - 1) return;
      await reorderNodes(sortedRootNodes, idx, idx + 1);
    },
    [sortedRootNodes, reorderNodes],
  );

  const renderItem = ({ item, index }: { item: Node; index: number }) => {
    // FlatListは inverted なので表示順は逆
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

  return (
    <>
      <KeyboardAvoidingView
        style={styles.container}
        behavior="padding"
        keyboardVerticalOffset={insets.bottom}
      >
        <View style={styles.header}>
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

        <FlatList
          data={[...sortedRootNodes].reverse()}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.messageList}
          inverted
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
  container: { flex: 1, backgroundColor: "#080c18" },
  header: {
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
  messageList: { padding: 16, gap: 8 },
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
