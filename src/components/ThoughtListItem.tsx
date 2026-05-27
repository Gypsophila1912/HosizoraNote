import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Thought } from "@/db/repositories/thoughtRepository";

type Props = {
  item: Thought;
  onPress: (thought: Thought) => void;
};

export default function ThoughtListItem({ item, onPress }: Props) {
  return (
    <TouchableOpacity
      style={styles.thoughtItem}
      onPress={() => onPress(item)}
      activeOpacity={0.7}
    >
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
      <Text style={styles.chevron}>›</Text>
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
  thoughtItemContent: { flex: 1 },
  thoughtTitle: { fontSize: 15, fontWeight: "600", color: "#e2e8f0" },
  thoughtTime: { fontSize: 12, color: "#64748b", marginTop: 2 },
  chevron: { fontSize: 22, color: "#a78bfa", marginLeft: 8 },
});
