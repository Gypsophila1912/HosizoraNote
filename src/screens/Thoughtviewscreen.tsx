import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  Alert,
} from "react-native";
import {
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ThoughtSelectStackParamList } from "@/navigation/types";
import { 
  getNodesByThoughtId, 
  getNodeById,
  deleteNode,
  reparentNodeChildren,
  updateNodeText,
  Node 
} from "@/db/repositories/nodeRepository";
import { Thought } from "@/db/repositories/thoughtRepository";
import { getAllTags, Tag } from "@/db/repositories/tagRepository";
import { db } from "@/db/index";
import { thoughtsTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { formatNodesToText } from "@/utils/nodeTreeFormatter";
import { summarizeNodes } from "@/utils/gemini";
import { Ionicons } from "@expo/vector-icons";
import MetaHeader from "@/components/MetaHeader";
import SummarizeModal from "@/components/SummarizeModal";
import ZoomableCanvas from "@/components/ZoomableCanvas";
import {
  NODE_W,
  NODE_H,
  PADDING,
  V_GAP,
  assignPositions,
  flattenTree,
  flattenEdges,
  OccupiedMap,
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
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  // 要約モーダル用
  const [modalVisible, setModalVisible] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [summary, setSummary] = useState("");

  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<number>>(new Set());

  const fetchNodes = async () => {
    const loadedNodes = await getNodesByThoughtId(thoughtId);
    setNodes(loadedNodes);
  };

  const navigateToChat = (parentNodeId?: number, threadRootId?: number) => {
    if (!thought) return;
    (navigation as any).navigate("HomeTab", {
      screen: "Chat",
      params: { thoughtId: thought.id, parentNodeId, threadRootId },
    });
  };

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
        const [loadedTags] = await Promise.all([
          getAllTags()
        ]);
        await fetchNodes();
        setTags(loadedTags);
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

  const handleEditSave = async (nodeId: number, newText: string) => {
    await updateNodeText(nodeId, newText);
    await fetchNodes();
  };

  const handleToggleSelect = (nodeId: number) => {
    setSelectedNodeIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  };

  const handleDeleteSelected = () => {
    if (selectedNodeIds.size === 0) return;
    Alert.alert(
      "ノードの削除",
      `選択した${selectedNodeIds.size}個のノードを削除しますか？\n途中のノードを削除した場合、その子ノードは親ノードに自動的に結合されます。`,
      [
        { text: "キャンセル", style: "cancel" },
        {
          text: "削除して結合",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              for (const id of selectedNodeIds) {
                // 最新の親IDを取得するために都度DBから引く
                const node = await getNodeById(id);
                if (node) {
                  await reparentNodeChildren(id, node.parentId);
                  await deleteNode(id);
                }
              }
              setSelectedNodeIds(new Set());
              setIsDeleteMode(false);
              await fetchNodes();
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
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
  const occupiedMap = new OccupiedMap();
  
  let prevRootX: number | null = null;
  let prevRootY: number | null = null;

  for (let i = sortedRoots.length - 1; i >= 0; i--) {
    const rn = sortedRoots[i];
    // rootのY座標は元々上から順に curY (i * NODE_H + V_GAP) だったので、それを逆算する
    // padding は上で定義されている
    const rnY = PADDING + i * (NODE_H + V_GAP);
    // Pass isRoot=true and reservedX=centerX to ensure roots take the center
    const tree = assignPositions(rn, centerX, rnY, childMap, occupiedMap, true, centerX);
    allLayoutNodes.push(...flattenTree(tree));
    allEdges.push(...flattenEdges(tree));

    if (prevRootX !== null && prevRootY !== null) {
      allEdges.push({ px: prevRootX, py: prevRootY + NODE_H, cx: tree.x, cy: tree.y, isMain: true });
    }

    prevRootX = tree.x;
    prevRootY = tree.y;
  }

  // Draw edges top down: reverse allEdges that are isMain
  allEdges.forEach(edge => {
     if (edge.isMain) {
        // Swap px, py with cx, cy since we iterated bottom up!
        const tpx = edge.px; const tpy = edge.py;
        edge.px = edge.cx; edge.py = edge.cy + NODE_H;
        edge.cx = tpx; edge.cy = tpy - NODE_H;
     }
  });

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
        <View style={styles.topActionsRow}>
          {isDeleteMode ? (
            <View style={styles.deleteModeActions}>
              <TouchableOpacity
                style={styles.cancelDeleteButton}
                onPress={() => {
                  setIsDeleteMode(false);
                  setSelectedNodeIds(new Set());
                }}
              >
                <Text style={styles.cancelDeleteText}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.executeDeleteButton,
                  selectedNodeIds.size === 0 && styles.disabledButton,
                ]}
                onPress={handleDeleteSelected}
                disabled={selectedNodeIds.size === 0}
              >
                <Text style={styles.executeDeleteText}>
                  削除 ({selectedNodeIds.size})
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.enterDeleteButton}
              onPress={() => setIsDeleteMode(true)}
            >
              <Ionicons name="trash-outline" size={20} color="#ef4444" />
            </TouchableOpacity>
          )}
        </View>
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
        isDeleteMode={isDeleteMode}
        selectedIds={selectedNodeIds}
        onToggleSelect={handleToggleSelect}
        onEditSave={handleEditSave}
        tagColorMap={tags.reduce<Record<number, string>>((acc, t) => {
          acc[t.id] = t.color;
          return acc;
        }, {})}
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
  topActionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: "#0d1225",
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
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { color: "#64748b", fontSize: 14 },
  hint: {
    alignItems: "center",
    paddingVertical: 4,
    backgroundColor: "rgba(167,139,250,0.08)",
  },
  hintText: { fontSize: 11, color: "#a78bfa" },
});
