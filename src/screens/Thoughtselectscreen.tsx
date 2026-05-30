import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useState, useEffect, useCallback } from "react";
import {
  useNavigation,
  useFocusEffect,
  CompositeNavigationProp,
} from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { ThoughtSelectStackParamList, TabParamList } from "@/navigation/types";
import {
  getThoughtsByDate,
  getAllThoughtDates,
  deleteThought,
  Thought,
} from "@/db/repositories/thoughtRepository";
import {
  getNodesByThoughtId,
  deleteNodesByThoughtId,
} from "@/db/repositories/nodeRepository";
import { useThoughtStore } from "@/store/useThoughtStore";
import MiniCalendar from "@/components/MiniCalendar";
import ThoughtListItem from "@/components/ThoughtListItem";

type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<ThoughtSelectStackParamList, "ThoughtSelect">,
  BottomTabNavigationProp<TabParamList>
>;

function toDateKey(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export default function ThoughtSelectScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [markedDates, setMarkedDates] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(true);

  // 削除モード用
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // 状態復元用
  const setCurrentThoughtId = useThoughtStore((s) => s.setCurrentThoughtId);
  const setTitle = useThoughtStore((s) => s.setTitle);
  const setNodes = useThoughtStore((s) => s.setNodes);

  // タブに戻るたび、または日付が変わるたびにデータを再取得
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const fetchData = async () => {
        setLoading(true);
        try {
          const [msList, updatedThoughts] = await Promise.all([
            getAllThoughtDates(),
            getThoughtsByDate(selectedDate),
          ]);
          if (isActive) {
            setMarkedDates(new Set(msList.map(toDateKey)));
            setThoughts(updatedThoughts);
          }
        } finally {
          if (isActive) setLoading(false);
        }
      };

      fetchData();

      return () => {
        isActive = false;
      };
    }, [selectedDate]),
  );

  const handleSelectThought = (thought: Thought) => {
    navigation.push("ThoughtView", { thoughtId: thought.id });
  };

  const handleToggleSelect = (thought: Thought) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(thought.id)) next.delete(thought.id);
      else next.add(thought.id);
      return next;
    });
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    Alert.alert(
      "削除の確認",
      `選択した${selectedIds.size}件の記録を削除しますか？\nこの操作は取り消せません。`,
      [
        { text: "キャンセル", style: "cancel" },
        {
          text: "削除",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            for (const id of selectedIds) {
              await deleteNodesByThoughtId(id);
              await deleteThought(id);
            }
            setSelectedIds(new Set());
            setIsDeleteMode(false);
            
            // カレンダーとリストを再取得
            const msList = await getAllThoughtDates();
            setMarkedDates(new Set(msList.map(toDateKey)));
            const updatedThoughts = await getThoughtsByDate(selectedDate);
            setThoughts(updatedThoughts);
            setLoading(false);
          },
        },
      ],
    );
  };

  const handleEdit = async (thought: Thought) => {
    setLoading(true);
    try {
      const loadedNodes = await getNodesByThoughtId(thought.id);
      setCurrentThoughtId(thought.id);
      setTitle(thought.title || "");
      setNodes(loadedNodes);
      navigation.navigate("HomeTab" as any);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) =>
    `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;

  return (
    <View style={styles.container}>
      {/* 上半分：thought一覧 */}
      <View style={[styles.listArea, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerRow}>
          <Text style={styles.dateLabel}>{formatDate(selectedDate)}</Text>
          {isDeleteMode ? (
            <View style={styles.deleteModeActions}>
              <TouchableOpacity
                style={styles.cancelDeleteButton}
                onPress={() => {
                  setIsDeleteMode(false);
                  setSelectedIds(new Set());
                }}
              >
                <Text style={styles.cancelDeleteText}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.executeDeleteButton,
                  selectedIds.size === 0 && styles.disabledButton,
                ]}
                onPress={handleDeleteSelected}
                disabled={selectedIds.size === 0}
              >
                <Text style={styles.executeDeleteText}>
                  削除 ({selectedIds.size})
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            thoughts.length > 0 && (
              <TouchableOpacity
                style={styles.enterDeleteButton}
                onPress={() => setIsDeleteMode(true)}
              >
                <Ionicons name="trash-outline" size={20} color="#ef4444" />
              </TouchableOpacity>
            )
          )}
        </View>

        {loading ? (
          <ActivityIndicator color="#22d3ee" style={{ marginTop: 24 }} />
        ) : thoughts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>この日の記録はありません</Text>
          </View>
        ) : (
            <FlatList
              data={thoughts}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <ThoughtListItem
                  item={item}
                  isDeleteMode={isDeleteMode}
                  isSelected={selectedIds.has(item.id)}
                  onPress={handleSelectThought}
                  onToggleSelect={handleToggleSelect}
                  onEdit={handleEdit}
                />
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
  container: { flex: 1, backgroundColor: "transparent" },
  listArea: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  dateLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#22d3ee",
    letterSpacing: 0.5,
  },
  deleteModeActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  enterDeleteButton: {
    padding: 4,
  },
  cancelDeleteButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  cancelDeleteText: {
    color: "#64748b",
    fontSize: 14,
    fontWeight: "600",
  },
  executeDeleteButton: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.5)",
  },
  disabledButton: {
    opacity: 0.5,
  },
  executeDeleteText: {
    color: "#ef4444",
    fontSize: 13,
    fontWeight: "600",
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
    borderTopColor: "rgba(34,211,238,0.2)",
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
    backgroundColor: "rgba(34,211,238,0.3)",
  },
  calendarToggleText: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "600",
  },
  calendarFixed: { height: 280 },
});
