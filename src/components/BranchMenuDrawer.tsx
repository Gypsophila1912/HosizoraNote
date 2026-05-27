import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Animated,
  Dimensions,
} from "react-native";
import { useEffect, useRef } from "react";
import * as NavigationBar from "expo-navigation-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Node } from "@/db/repositories/nodeRepository";

type Props = {
  visible: boolean;
  onClose: () => void;
  allNodes: Node[];
  onSelectBranch: (parentNodeId: number, threadRootId?: number) => void;
};

const DRAWER_WIDTH = Math.min(Dimensions.get("window").width * 0.72, 300);

export default function BranchMenuDrawer({
  visible,
  onClose,
  allNodes,
  onSelectBranch,
}: Props) {
  const insets = useSafeAreaInsets();
  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Edge-to-edgeが有効な場合、setBackgroundColorAsyncは非対応の警告が出るため無効化
    // if (visible) {
    //   NavigationBar.setBackgroundColorAsync("#0d1225");
    //   NavigationBar.setButtonStyleAsync("light");
    // } else {
    //   NavigationBar.setBackgroundColorAsync("#080c18");
    //   NavigationBar.setButtonStyleAsync("light");
    // }
  }, [visible]);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: -DRAWER_WIDTH,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const childMap: Record<number, Node[]> = {};
  allNodes.forEach((n) => {
    if (n.parentId !== null) {
      (childMap[n.parentId] ??= []).push(n);
    }
  });

  const branchRootNodes: Node[] = [];

  allNodes.forEach((n) => {
    if (n.parentId === null) return;

    const siblings = childMap[n.parentId] || [];
    const sortedSiblings = siblings.slice().sort((a, b) => a.createdAt - b.createdAt);

    const parentNode = allNodes.find(p => p.id === n.parentId);
    if (!parentNode) return;

    if (parentNode.parentId === null) {
      branchRootNodes.push(n);
    } else {
      if (sortedSiblings.length > 0 && sortedSiblings[0].id !== n.id) {
        branchRootNodes.push(n);
      }
    }
  });

  branchRootNodes.sort((a, b) => b.createdAt - a.createdAt);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.wrapper}>
        {/* ── ドロワー本体（左からスライド） ── */}
        <Animated.View
          style={[
            styles.drawer,
            {
              paddingTop: insets.top,
              paddingBottom: insets.bottom,
              transform: [{ translateX }],
            },
          ]}
        >
          {/* ドロワーヘッダー */}
          <View style={styles.drawerHeader}>
            <Text style={styles.drawerTitle}>分岐元ノード</Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          {branchRootNodes.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                まだ分岐はありません。{"\n"}
                メッセージを左スワイプすると{"\n"}分岐できます
              </Text>
            </View>
          ) : (
            <FlatList
              data={branchRootNodes}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.listContent}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.branchItem}
                  activeOpacity={0.7}
                  onPress={() => {
                    onClose();
                    onSelectBranch(item.parentId!, item.id);
                  }}
                >
                  <View style={styles.branchIcon}>
                    <Text style={styles.branchIconText}>↳</Text>
                  </View>
                  <View style={styles.branchTextWrap}>
                    <Text
                      style={styles.branchNodeText}
                      numberOfLines={2}
                      ellipsizeMode="tail"
                    >
                      {item.text}
                    </Text>
                    <Text style={styles.branchNodeTime}>
                      {new Date(item.createdAt).toLocaleString("ja-JP", {
                        month: "numeric",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>
              )}
            />
          )}
        </Animated.View>

        {/* ── バックドロップ（タップで閉じる） ── */}
        <Animated.View
          style={[styles.backdrop, { opacity: backdropOpacity }]}
          pointerEvents={visible ? "auto" : "none"}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={onClose}
          />
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    flexDirection: "row",
  },
  drawer: {
    width: DRAWER_WIDTH,
    backgroundColor: "#0d1225",
    borderRightWidth: 1,
    borderRightColor: "rgba(167,139,250,0.2)",
    shadowColor: "#a78bfa",
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
    zIndex: 10,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
    zIndex: 5,
  },
  drawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "rgba(167,139,250,0.15)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(167,139,250,0.2)",
  },
  drawerTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#e2e8f0",
    letterSpacing: 1,
  },
  closeIcon: {
    fontSize: 16,
    color: "#a78bfa",
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  emptyText: {
    fontSize: 13,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 20,
  },
  listContent: { paddingVertical: 8 },
  separator: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    marginHorizontal: 16,
  },
  branchItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  branchIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(167,139,250,0.15)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  branchIconText: {
    fontSize: 14,
    color: "#a78bfa",
    fontWeight: "700",
  },
  branchTextWrap: { flex: 1, gap: 3 },
  branchNodeText: {
    fontSize: 14,
    color: "#e2e8f0",
    lineHeight: 20,
  },
  branchNodeTime: { fontSize: 11, color: "#64748b" },
  chevron: { fontSize: 20, color: "#a78bfa", flexShrink: 0 },
});
