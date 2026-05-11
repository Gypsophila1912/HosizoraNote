import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useState, useEffect, useCallback } from "react";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ThoughtSelectStackParamList } from "@/navigation/types";
import {
  getThoughtsByDate,
  getAllThoughtDates,
  Thought,
} from "@/db/repositories/thoughtRepository";
import MiniCalendar from "@/components/MiniCalendar";
import ThoughtListItem from "@/components/ThoughtListItem";

type Nav = NativeStackNavigationProp<
  ThoughtSelectStackParamList,
  "ThoughtSelect"
>;

function toDateKey(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export default function ThoughtSelectScreen() {
  const navigation = useNavigation<Nav>();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [markedDates, setMarkedDates] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(true);

  // タブに戻るたびにマーク日付を再取得
  useFocusEffect(
    useCallback(() => {
      getAllThoughtDates().then((msList) => {
        const keys = new Set(msList.map(toDateKey));
        setMarkedDates(keys);
      });
    }, []),
  );

  // 日付が変わるたびにthought一覧を取得
  useEffect(() => {
    setLoading(true);
    getThoughtsByDate(selectedDate)
      .then(setThoughts)
      .finally(() => setLoading(false));
  }, [selectedDate]);

  const handleSelectThought = (thought: Thought) => {
    navigation.push("ThoughtView", { thoughtId: thought.id });
  };

  const formatDate = (date: Date) =>
    `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;

  return (
    <View style={styles.container}>
      {/* 上半分：thought一覧 */}
      <View style={styles.listArea}>
        <Text style={styles.dateLabel}>{formatDate(selectedDate)}</Text>

        {loading ? (
          <ActivityIndicator color="#5C6BC0" style={{ marginTop: 24 }} />
        ) : thoughts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>この日の記録はありません</Text>
          </View>
        ) : (
          <FlatList
            data={thoughts}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <ThoughtListItem item={item} onPress={handleSelectThought} />
            )}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}
      </View>

      {/* 下半分：カレンダー */}
      <View style={styles.calendarArea}>
        {/* トグルボタン */}
        <TouchableOpacity
          style={styles.calendarToggle}
          onPress={() => setCalendarOpen((v) => !v)}
          activeOpacity={0.7}
        >
          <View style={styles.calendarToggleBar} />
          <Text style={styles.calendarToggleText}>
            {calendarOpen ? "カレンダーを閉じる ▾" : "カレンダーを開く ▴"}
          </Text>
        </TouchableOpacity>

        {/* 高さ固定のラッパー */}
        {calendarOpen && (
          <View style={styles.calendarFixed}>
            <MiniCalendar
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              markedDates={markedDates}
            />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#080c18" },
  listArea: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  dateLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#a78bfa",
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 32,
  },
  emptyText: { color: "#64748b", fontSize: 14 },
  listContent: { paddingBottom: 8 },
  separator: { height: 8 },
  calendarArea: {
    backgroundColor: "#0d1225",
    borderTopWidth: 1,
    borderTopColor: "rgba(167,139,250,0.2)",
    elevation: 4,
  },
  calendarToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    gap: 6,
  },
  calendarToggleBar: {
    width: 32,
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(167,139,250,0.3)",
  },
  calendarToggleText: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "600",
  },
  calendarFixed: { height: 280 },
});
