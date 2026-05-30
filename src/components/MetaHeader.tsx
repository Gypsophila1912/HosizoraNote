import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Thought } from "@/db/repositories/thoughtRepository";

type Props = {
  thought: Thought | null;
  onSummarize: () => void;
};

export default function MetaHeader({ thought, onSummarize }: Props) {
  const fmt = (ms: number) =>
    new Date(ms).toLocaleString("ja-JP", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <View style={styles.metaCard}>
      <View style={styles.metaRow}>
        <View style={styles.metaTextArea}>
          <Text style={styles.metaTitle}>
            {thought?.title?.trim() ? thought.title : "（タイトルなし）"}
          </Text>
          {thought && (
            <Text style={styles.metaDate}>{fmt(thought.createdAt)}</Text>
          )}
        </View>
        {/* 要約ボタン */}
        <TouchableOpacity style={styles.summarizeButton} onPress={onSummarize}>
          <Text style={styles.summarizeButtonText}>✦ 要約</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  metaCard: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(34,211,238,0.2)",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  metaTextArea: { flex: 1, marginRight: 12 },
  metaTitle: { fontSize: 17, fontWeight: "700", color: "#e2e8f0" },
  metaDate: { fontSize: 12, color: "#64748b", marginTop: 4 },
  summarizeButton: {
    backgroundColor: "rgba(34,211,238,0.15)",
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.4)",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  summarizeButtonText: {
    color: "#22d3ee",
    fontSize: 13,
    fontWeight: "600",
  },
});
