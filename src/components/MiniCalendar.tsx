import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useState } from "react";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

type Props = {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  /** "YYYY-M-D" 形式のキーのSet */
  markedDates: Set<string>;
};

export default function MiniCalendar({
  selectedDate,
  onSelectDate,
  markedDates,
}: Props) {
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
              style={cal.cell}
              onPress={() => onSelectDate(cellDate)}
            >
              {isSelected && <View style={cal.selectionBg} />}
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
              <View
                style={[
                  cal.dot,
                  isSelected && cal.dotSelected,
                  !hasThought && { backgroundColor: "transparent" },
                ]}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const cal = StyleSheet.create({
  container: { paddingHorizontal: 12, paddingBottom: 0, paddingTop: 4 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  navBtn: { padding: 8 },
  navText: { fontSize: 16, color: "#a78bfa", fontWeight: "700" },
  monthLabel: { fontSize: 15, fontWeight: "700", color: "#e2e8f0" },
  weekRow: { flexDirection: "row", marginBottom: 2 },
  weekLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "600",
    color: "#64748b",
    paddingVertical: 2,
  },
  sunday: { color: "#f87171" },
  saturday: { color: "#a78bfa" },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  selectionBg: {
    position: "absolute",
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#a78bfa",
    marginTop: 9,
  },
  dayText: { fontSize: 13, color: "#e2e8f0" },
  selectedDayText: { color: "#fff", fontWeight: "700" },
  todayText: { color: "#fbbf24", fontWeight: "700" },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#fbbf24",
    marginTop: 1,
  },
  dotSelected: { backgroundColor: "#fff" },
});
