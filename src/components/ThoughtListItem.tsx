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
            color={isSelected ? "#a78bfa" : "#64748b"}
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
          <Ionicons name="pencil" size={20} color="#a78bfa" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  thoughtItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.2)",
  },
  selectedItem: {
    backgroundColor: "rgba(167,139,250,0.15)",
    borderColor: "#a78bfa",
  },
  checkboxContainer: {
    marginRight: 12,
  },
  thoughtItemContent: { flex: 1 },
  thoughtTitle: { fontSize: 15, fontWeight: "600", color: "#e2e8f0" },
  thoughtTime: { fontSize: 12, color: "#64748b", marginTop: 2 },
  editButton: {
    padding: 4,
  },
});
