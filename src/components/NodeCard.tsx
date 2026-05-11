import { View, Text, StyleSheet } from "react-native";
import { Node } from "@/db/repositories/nodeRepository";

export const NODE_W = 140;
export const NODE_H = 72;

export type LayoutNode = {
  node: Node;
  x: number;
  y: number;
  children: LayoutNode[];
};

type Props = { ln: LayoutNode };

export default function NodeCard({ ln }: Props) {
  const { node, x, y } = ln;
  const isRoot = node.parentId == null;

  return (
    <View
      style={[
        card.box,
        {
          position: "absolute",
          left: x - NODE_W / 2,
          top: y,
          width: NODE_W,
          height: NODE_H,
        },
        isRoot && card.rootBox,
      ]}
    >
      <Text style={[card.text, isRoot && card.rootText]} numberOfLines={3}>
        {node.text}
      </Text>
      <Text style={[card.time, isRoot && card.rootTime]}>
        {new Date(node.createdAt).toLocaleTimeString("ja-JP", {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </Text>
    </View>
  );
}

const card = StyleSheet.create({
  box: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.2)",
    justifyContent: "space-between",
  },
  mainBox: {
    backgroundColor: "rgba(167,139,250,0.15)",
    borderColor: "rgba(167,139,250,0.5)",
  },
  rootBox: {
    backgroundColor: "rgba(167,139,250,0.35)",
    borderColor: "#a78bfa",
    borderWidth: 2,
  },
  text: { fontSize: 12, color: "#e2e8f0", lineHeight: 16 },
  mainText: { color: "#fff" },
  rootText: { color: "#fff", fontWeight: "600" },
  time: { fontSize: 10, color: "#64748b", alignSelf: "flex-end" },
  mainTime: { color: "#c4b5fd" },
  rootTime: { color: "#c4b5fd" },
});
