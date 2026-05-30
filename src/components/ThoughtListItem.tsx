import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Thought } from "@/db/repositories/thoughtRepository";

type Props = {
  item: Thought;
  isDeleteMode: boolean;
  isSelected: boolean;
  onPress: (thought: Thought) => void;
  onToggleSelect: (thought: Thought) => void;
  onEdit: (thought: Thought) => void;
};

export default function ThoughtListItem({
  item,
  isDeleteMode,
  isSelected,
  onPress,
  onToggleSelect,
  onEdit,
}: Props) {
  return (
    <View style={styles.itemWrapper}>
      {/* ボックスの外（左隣）に配置する黄色い発光する星のような丸 */}
      <View style={styles.glowingStarContainer}>
        <View style={styles.glowingStar} />
      </View>

      <TouchableOpacity
        style={[styles.thoughtItem, isSelected && styles.selectedItem]}
        onPress={() => (isDeleteMode ? onToggleSelect(item) : onPress(item))}
        activeOpacity={0.7}
      >
        {isDeleteMode && (
          <View style={styles.checkboxContainer}>
            <Ionicons
              name={isSelected ? "checkmark-circle" : "ellipse-outline"}
              size={24}
              color={isSelected ? "#22d3ee" : "#64748b"}
            />
          </View>
        )}

        <View style={styles.thoughtItemContent}>
          <Text style={styles.thoughtTitle} numberOfLines={1}>
            {item.title?.trim() ? item.title : "（タイトルなし）"}
          </Text>
          <Text style={styles.thoughtTime}>
            {new Date(item.createdAt).toLocaleTimeString("ja-JP", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
        {!isDeleteMode && (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => onEdit(item)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="pencil" size={20} color="#22d3ee" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  itemWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  thoughtItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.2)",
  },
  selectedItem: {
    backgroundColor: "rgba(34,211,238,0.15)",
    borderColor: "#22d3ee",
  },
  checkboxContainer: {
    marginRight: 12,
  },
  glowingStarContainer: {
    width: 20,
    marginRight: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  glowingStar: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#fde047", // 明るい黄色
    shadowColor: "#fef08a",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 14,
    elevation: 10,
  },
  thoughtItemContent: { flex: 1 },
  thoughtTitle: { fontSize: 15, fontWeight: "600", color: "#e2e8f0" },
  thoughtTime: { fontSize: 12, color: "#64748b", marginTop: 2 },
  editButton: {
    padding: 4,
  },
});
