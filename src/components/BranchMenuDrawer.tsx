import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Node } from "@/db/repositories/nodeRepository";

type Props = {
  visible: boolean;
  onClose: () => void;
  allNodes: Node[];
  onSelectBranch: (nodeId: number) => void;
};

export default function BranchMenuDrawer({
  visible,
  onClose,
  allNodes,
  onSelectBranch,
}: Props) {
  const insets = useSafeAreaInsets();

  const parentIdSet = new Set(
    allNodes.map((n) => n.parentId).filter((id): id is number => id !== null),
  );
  const branchOrigins = allNodes.filter((n) => parentIdSet.has(n.id));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* 全画面を横並びで: [ドロワー本体] [バックドロップ] */}
      <View style={styles.wrapper}>
        {/* ── ドロワー本体（左側） ── */}
        <View
          style={[
            styles.drawer,
            { paddingTop: insets.top, paddingBottom: insets.bottom },
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

          {branchOrigins.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                まだ分岐はありません。{"\n"}
                メッセージを左スワイプすると{"\n"}分岐できます
              </Text>
            </View>
          ) : (
            <FlatList
              data={branchOrigins}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.listContent}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.branchItem}
                  activeOpacity={0.7}
                  onPress={() => {
                    onClose();
                    onSelectBranch(item.id);
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
        </View>

        {/* ── バックドロップ（右側・タップで閉じる） ── */}
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "transparent",
  },
  drawer: {
    width: "72%",
    maxWidth: 300,
    backgroundColor: "#0d1225",
    borderRightWidth: 1,
    borderRightColor: "rgba(167,139,250,0.2)",
    shadowColor: "#a78bfa",
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
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
