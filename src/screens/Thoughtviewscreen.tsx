import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import {
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ThoughtSelectStackParamList } from "@/navigation/types";
import { getNodesByThoughtId, Node } from "@/db/repositories/nodeRepository";
import { Thought } from "@/db/repositories/thoughtRepository";
import { db } from "@/db/index";
import { thoughtsTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { formatNodesToText } from "@/utils/nodeTreeFormatter";
import { summarizeNodes } from "@/utils/gemini";
import MetaHeader from "@/components/MetaHeader";
import SummarizeModal from "@/components/SummarizeModal";
import ZoomableCanvas from "@/components/ZoomableCanvas";
import {
  NODE_W,
  NODE_H,
  PADDING,
  assignPositions,
  flattenTree,
  flattenEdges,
} from "@/utils/treeLayout";

type Route = RouteProp<ThoughtSelectStackParamList, "ThoughtView">;
type Nav = NativeStackNavigationProp<
  ThoughtSelectStackParamList,
  "ThoughtView"
>;

const SCREEN = Dimensions.get("window");

export default function ThoughtViewScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { thoughtId } = route.params;

  const [thought, setThought] = useState<Thought | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [loading, setLoading] = useState(true);

  // 要約モーダル用
  const [modalVisible, setModalVisible] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [summary, setSummary] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const rows = await db
          .select()
          .from(thoughtsTable)
          .where(eq(thoughtsTable.id, thoughtId));
        const t = rows[0] ?? null;
        setThought(t);
        setNodes(await getNodesByThoughtId(thoughtId));
        if (t?.title?.trim()) navigation.setOptions({ title: t.title });
      } finally {
        setLoading(false);
      }
    })();
  }, [thoughtId]);

  const handleSummarize = async () => {
    setModalVisible(true);
    setSummarizing(true);
    setSummary("");
    try {
      const treeText = formatNodesToText(nodes);
      const result = await summarizeNodes(treeText);
      setSummary(result);
    } catch (e) {
      setSummary("要約に失敗しました。通信環境を確認してください。");
    } finally {
      setSummarizing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#a78bfa" />
      </View>
    );
  }

  // ── ツリーレイアウト計算 ──
  const childMap: Record<number, Node[]> = {};
  for (const n of nodes) {
    if (n.parentId != null) (childMap[n.parentId] ??= []).push(n);
  }
  const rootNodes = nodes.filter((n) => n.parentId == null);

  if (rootNodes.length === 0) {
    return (
      <View style={styles.container}>
        <MetaHeader thought={thought} onSummarize={handleSummarize} />
        <View style={styles.center}>
          <Text style={styles.emptyText}>ノードがありません</Text>
        </View>
      </View>
    );
  }

  const centerX = Math.max(NODE_W / 2 + PADDING, SCREEN.width / 2);
  const sortedRoots = rootNodes
    .slice()
    .sort((a, b) => a.createdAt - b.createdAt);

  let curY = PADDING;
  const allLayoutNodes: ReturnType<typeof flattenTree> = [];
  const allEdges: ReturnType<typeof flattenEdges> = [];

  for (let i = 0; i < sortedRoots.length; i++) {
    const rn = sortedRoots[i];
    const tree = assignPositions(rn, centerX, curY, childMap);
    allLayoutNodes.push(...flattenTree(tree));
    allEdges.push(...flattenEdges(tree));

    if (i < sortedRoots.length - 1) {
      const nextY = curY + NODE_H + 60;
      allEdges.push({ px: centerX, py: curY + NODE_H, cx: centerX, cy: nextY });
      curY = nextY;
    } else {
      curY = curY + NODE_H + 60;
    }
  }

  const canvasW = Math.max(
    ...allLayoutNodes.map((ln) => ln.x + NODE_W / 2 + PADDING),
    SCREEN.width,
  );
  const canvasH = Math.max(
    ...allLayoutNodes.map((ln) => ln.y + NODE_H + PADDING),
    SCREEN.height,
  );

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.headerLayer}>
        <MetaHeader thought={thought} onSummarize={handleSummarize} />
        <View style={styles.hint}>
          <Text style={styles.hintText}>
            ピンチでズーム・1本指でドラッグ移動
          </Text>
        </View>
      </View>
      <ZoomableCanvas
        canvasW={canvasW}
        canvasH={canvasH}
        allLayoutNodes={allLayoutNodes}
        allEdges={allEdges}
        mainChildIds={new Set()}
      />
      <SummarizeModal
        visible={modalVisible}
        loading={summarizing}
        summary={summary}
        onClose={() => setModalVisible(false)}
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#080c18" },
  headerLayer: { zIndex: 10, elevation: 10, backgroundColor: "#0d1225" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { color: "#64748b", fontSize: 14 },
  hint: {
    alignItems: "center",
    paddingVertical: 4,
    backgroundColor: "rgba(167,139,250,0.08)",
  },
  hintText: { fontSize: 11, color: "#a78bfa" },
});
