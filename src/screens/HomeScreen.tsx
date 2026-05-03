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
  Animated,
  PanResponder,
} from "react-native";
import { useState, useRef, useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { HomeStackParamList } from "@/navigation/types";
import { useThought } from "@/hooks/useThought";
import { Node } from "@/db/repositories/nodeRepository";
import BranchMenuDrawer from "@/components/BranchMenuDrawer";

type Nav = NativeStackNavigationProp<HomeStackParamList, "Home">;

function SwipeableMessage({
  item,
  childCount,
  onSwipeLeft,
}: {
  item: Node;
  childCount: number;
  onSwipeLeft: (node: Node) => void;
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const triggered = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dx) > 8 && Math.abs(gs.dx) > Math.abs(gs.dy) * 1.5,
      onPanResponderMove: (_, gs) => {
        if (gs.dx < 0) translateX.setValue(Math.max(gs.dx, -80));
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dx < -50 && !triggered.current) {
          triggered.current = true;
          Animated.timing(translateX, {
            toValue: -80,
            duration: 100,
            useNativeDriver: true,
          }).start(() => {
            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: true,
            }).start(() => {
              triggered.current = false;
            });
            onSwipeLeft(item);
          });
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    }),
  ).current;

  return (
    <View style={styles.swipeRow}>
      <View style={styles.swipeHint}>
        <Text style={styles.swipeHintText}>分岐</Text>
      </View>
      <Animated.View
        style={{ transform: [{ translateX }] }}
        {...panResponder.panHandlers}
      >
        <View style={styles.messageBubble}>
          <Text style={styles.messageText}>{item.text}</Text>
          <View style={styles.messageMeta}>
            <Text style={styles.messageTime}>
              {new Date(item.createdAt).toLocaleTimeString("ja-JP", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
            {childCount > 0 && (
              <View style={styles.branchBadge}>
                <Text style={styles.branchBadgeText}>分岐 {childCount}</Text>
              </View>
            )}
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const {
    title,
    nodes,
    currentThoughtId,
    changeTitle,
    sendMessage,
    complete,
    resetThought,
  } = useThought();
  const [inputText, setInputText] = useState("");
  const [menuVisible, setMenuVisible] = useState(false);

  const childCountMap = nodes.reduce<Record<number, number>>((acc, n) => {
    if (n.parentId != null) acc[n.parentId] = (acc[n.parentId] ?? 0) + 1;
    return acc;
  }, {});

  const rootNodes = nodes.filter((n) => n.parentId == null);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    await sendMessage(inputText);
    setInputText("");
  };

  const handleComplete = async () => {
    await complete();
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
      });
    },
    [currentThoughtId, navigation],
  );

  const handleSelectBranch = useCallback(
    (nodeId: number) => {
      if (!currentThoughtId) return;
      navigation.push("Detail", {
        thoughtId: currentThoughtId,
        parentNodeId: nodeId,
      });
    },
    [currentThoughtId, navigation],
  );

  const renderItem = ({ item }: { item: Node }) => (
    <SwipeableMessage
      item={item}
      childCount={childCountMap[item.id] ?? 0}
      onSwipeLeft={handleSwipeLeft}
    />
  );

  return (
    <>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 85}
      >
        {/* ───── 独自ヘッダー ───── */}
        <View style={styles.header}>
          {/* ハンバーガー（タイトル入力欄の左） */}
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

        <FlatList
          data={[...rootNodes].reverse()}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.messageList}
          inverted
        />

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
  container: { flex: 1, backgroundColor: "#f5f5f5" },
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
  hamburgerButton: {
    justifyContent: "center",
    paddingRight: 4,
  },
  hamburgerLine: {
    width: 20,
    height: 2,
    backgroundColor: "#5C6BC0",
    borderRadius: 1,
    marginVertical: 2,
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
  resetButtonText: { fontSize: 13, color: "#9E9E9E" },
  completeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#5C6BC0",
  },
  completeButtonText: { fontSize: 13, color: "#fff", fontWeight: "700" },
  messageList: { padding: 16, gap: 8 },
  swipeRow: { position: "relative", marginBottom: 8 },
  swipeHint: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 64,
    backgroundColor: "#5C6BC0",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  swipeHintText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  messageBubble: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    maxWidth: "80%",
    alignSelf: "flex-end",
    elevation: 2,
  },
  messageText: { fontSize: 16, color: "#212121" },
  messageMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 8,
    alignSelf: "flex-end",
  },
  messageTime: { fontSize: 11, color: "#9E9E9E" },
  branchBadge: {
    backgroundColor: "#EDE7F6",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  branchBadgeText: { fontSize: 11, color: "#5C6BC0", fontWeight: "600" },
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
