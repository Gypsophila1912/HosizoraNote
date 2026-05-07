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

type Nav = NativeStackNavigationProp<
  ThoughtSelectStackParamList,
  "ThoughtSelect"
>;

// ── カレンダー用ユーティリティ ──────────────────────────────────────

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

function toDateKey(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// ── カレンダーコンポーネント ──────────────────────────────────────

type CalendarProps = {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  markedDates: Set<string>; // "YYYY-M-D" 形式のキー
};

function MiniCalendar({
  selectedDate,
  onSelectDate,
  markedDates,
}: CalendarProps) {
  const [viewYear, setViewYear] = useState(selectedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(selectedDate.getMonth());

  const today = new Date();

  const firstDay = new Date(viewYear, viewMonth, 1).getDay(); // 0=日
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else setViewMonth((m) => m + 1);
  };

  // グリッド用：先頭の空白 + 日付
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <View style={cal.container}>
      {/* ヘッダー：月移動 */}
      <View style={cal.header}>
        <TouchableOpacity onPress={prevMonth} style={cal.navBtn}>
          <Text style={cal.navText}>＜</Text>
        </TouchableOpacity>
        <Text style={cal.monthLabel}>
          {viewYear}年 {viewMonth + 1}月
        </Text>
        <TouchableOpacity onPress={nextMonth} style={cal.navBtn}>
          <Text style={cal.navText}>＞</Text>
        </TouchableOpacity>
      </View>

      {/* 曜日ヘッダー */}
      <View style={cal.weekRow}>
        {WEEKDAYS.map((w, i) => (
          <Text
            key={w}
            style={[
              cal.weekLabel,
              i === 0 && cal.sunday,
              i === 6 && cal.saturday,
            ]}
          >
            {w}
          </Text>
        ))}
      </View>

      {/* 日付グリッド */}
      <View style={cal.grid}>
        {cells.map((day, idx) => {
          if (day === null)
            return <View key={`empty-${idx}`} style={cal.cell} />;

          const cellDate = new Date(viewYear, viewMonth, day);
          const key = `${viewYear}-${viewMonth}-${day}`;
          const isSelected = isSameDay(cellDate, selectedDate);
          const isToday = isSameDay(cellDate, today);
          const hasThought = markedDates.has(key);
          const dayOfWeek = (firstDay + day - 1) % 7;
          const isSun = dayOfWeek === 0;
          const isSat = dayOfWeek === 6;

          return (
            <TouchableOpacity
              key={key}
              style={[cal.cell, isSelected && cal.selectedCell]}
              onPress={() => onSelectDate(cellDate)}
            >
              <Text
                style={[
                  cal.dayText,
                  isSun && cal.sunday,
                  isSat && cal.saturday,
                  isSelected && cal.selectedDayText,
                  isToday && !isSelected && cal.todayText,
                ]}
              >
                {day}
              </Text>
              {hasThought && (
                <View style={[cal.dot, isSelected && cal.dotSelected]} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ── メイン画面 ──────────────────────────────────────────────────

export default function ThoughtSelectScreen() {
  const navigation = useNavigation<Nav>();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [markedDates, setMarkedDates] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

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
              <TouchableOpacity
                style={styles.thoughtItem}
                onPress={() => handleSelectThought(item)}
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
            )}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}
      </View>

      {/* 下半分：カレンダー */}
      <View style={styles.calendarArea}>
        <MiniCalendar
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          markedDates={markedDates}
        />
      </View>
    </View>
  );
}

// ── スタイル ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },

  // 上半分
  listArea: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  dateLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#5C6BC0",
    marginBottom: 10,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 32,
  },
  emptyText: { color: "#9E9E9E", fontSize: 14 },
  listContent: { paddingBottom: 8 },
  thoughtItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    elevation: 1,
  },
  thoughtItemContent: { flex: 1 },
  thoughtTitle: { fontSize: 15, fontWeight: "600", color: "#212121" },
  thoughtTime: { fontSize: 12, color: "#9E9E9E", marginTop: 2 },
  chevron: { fontSize: 22, color: "#C5CAE9", marginLeft: 8 },
  separator: { height: 8 },

  // 下半分
  calendarArea: {
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    elevation: 4,
  },
});

const cal = StyleSheet.create({
  container: { paddingHorizontal: 12, paddingBottom: 0, paddingTop: 4 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  navBtn: { padding: 8 },
  navText: { fontSize: 16, color: "#5C6BC0", fontWeight: "700" },
  monthLabel: { fontSize: 15, fontWeight: "700", color: "#212121" },
  weekRow: { flexDirection: "row", marginBottom: 2 },
  weekLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "600",
    color: "#757575",
    paddingVertical: 2,
  },
  sunday: { color: "#E57373" },
  saturday: { color: "#5C6BC0" },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedCell: {
    backgroundColor: "#5C6BC0",
    borderRadius: 999,
  },
  dayText: { fontSize: 13, color: "#212121" },
  selectedDayText: { color: "#fff", fontWeight: "700" },
  todayText: { color: "#5C6BC0", fontWeight: "700" },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#5C6BC0",
    marginTop: 1,
  },
  dotSelected: { backgroundColor: "#fff" },
});
