import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Animated,
} from "react-native";
import {
  GestureHandlerRootView,
  PinchGestureHandler,
  PanGestureHandler,
  State,
} from "react-native-gesture-handler";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ThoughtSelectStackParamList } from "@/navigation/types";
import { getNodesByThoughtId, Node } from "@/db/repositories/nodeRepository";
import { Thought } from "@/db/repositories/thoughtRepository";
import { db } from "@/db/index";
import { thoughtsTable } from "@/db/schema";
import { eq } from "drizzle-orm";

type Route = RouteProp<ThoughtSelectStackParamList, "ThoughtView">;
type Nav = NativeStackNavigationProp<
  ThoughtSelectStackParamList,
  "ThoughtView"
>;

// ── レイアウト定数 ──────────────────────────────────────────────
const NODE_W = 140;
const NODE_H = 72;
const H_GAP = 24;
const V_GAP = 60;
const PADDING = 48;
const SCREEN = Dimensions.get("window");
const SCALE_MIN = 0.15;
const SCALE_MAX = 6;

// ── 型 ──────────────────────────────────────────────────────────
type LayoutNode = { node: Node; x: number; y: number; children: LayoutNode[] };
type Edge = { px: number; py: number; cx: number; cy: number };

// ── ツリーレイアウト計算 ────────────────────────────────────────

function getMainChild(
  nodeId: number,
  childMap: Record<number, Node[]>,
): Node | undefined {
  return (childMap[nodeId] ?? [])
    .slice()
    .sort((a, b) => a.createdAt - b.createdAt)[0];
}

function getBranchChildren(
  nodeId: number,
  childMap: Record<number, Node[]>,
): Node[] {
  return (childMap[nodeId] ?? [])
    .slice()
    .sort((a, b) => a.createdAt - b.createdAt)
    .slice(1);
}

function branchSubtreeWidth(
  nodeId: number,
  childMap: Record<number, Node[]>,
): number {
  const branches = getBranchChildren(nodeId, childMap);
  if (branches.length === 0) return NODE_W;
  return Math.max(
    NODE_W,
    branches.reduce(
      (sum, c) => sum + branchSubtreeWidth(c.id, childMap) + H_GAP,
      -H_GAP,
    ),
  );
}

function assignPositions(
  node: Node,
  centerX: number,
  topY: number,
  childMap: Record<number, Node[]>,
): LayoutNode {
  const children = (childMap[node.id] ?? [])
    .slice()
    .sort((a, b) => a.createdAt - b.createdAt);

  const layoutChildren: LayoutNode[] = [];
  const childY = topY + NODE_H + V_GAP;

  // 全子ノードを右側に横並び（分岐扱い）
  if (children.length > 0) {
    let curX = centerX + NODE_W / 2 + H_GAP * 2;
    for (const c of children) {
      const bw = branchSubtreeWidth(c.id, childMap);
      layoutChildren.push(assignPositions(c, curX + bw / 2, childY, childMap));
      curX += bw + H_GAP;
    }
  }

  return { node, x: centerX, y: topY, children: layoutChildren };
}

function flattenTree(root: LayoutNode): LayoutNode[] {
  return [root, ...root.children.flatMap(flattenTree)];
}

function flattenEdges(root: LayoutNode): Edge[] {
  return root.children.flatMap((child) => [
    { px: root.x, py: root.y + NODE_H, cx: child.x, cy: child.y },
    ...flattenEdges(child),
  ]);
}

function buildMainChildIds(nodes: Node[]): Set<number> {
  const map: Record<number, Node[]> = {};
  for (const n of nodes) {
    if (n.parentId != null) (map[n.parentId] ??= []).push(n);
  }
  const ids = new Set<number>();
  for (const children of Object.values(map)) {
    const sorted = children.slice().sort((a, b) => a.createdAt - b.createdAt);
    if (sorted[0]) ids.add(sorted[0].id);
  }
  return ids;
}

// ── 折れ線コネクター ────────────────────────────────────────────

function ConnectorLine({ px, py, cx, cy }: Edge) {
  const midY = (py + cy) / 2;
  const left = Math.min(px, cx);
  const lineW = Math.abs(px - cx);
  const COLOR = "rgba(167,139,250,0.4)";
  const T = 1.5;
  return (
    <>
      <View
        style={{
          position: "absolute",
          left: px - T / 2,
          top: py,
          width: T,
          height: midY - py,
          backgroundColor: COLOR,
        }}
      />
      {lineW > 0 && (
        <View
          style={{
            position: "absolute",
            left,
            top: midY - T / 2,
            width: lineW,
            height: T,
            backgroundColor: COLOR,
          }}
        />
      )}
      <View
        style={{
          position: "absolute",
          left: cx - T / 2,
          top: midY,
          width: T,
          height: cy - midY,
          backgroundColor: COLOR,
        }}
      />
    </>
  );
}

// ── ノードカード ────────────────────────────────────────────────

function NodeCard({ ln }: { ln: LayoutNode }) {
  const { node, x, y } = ln;
  const isRoot = node.parentId == null; // rootNode = 本筋

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
// ── ZoomableCanvas ──────────────────────────────────────────────

function ZoomableCanvas({
  canvasW,
  canvasH,
  allLayoutNodes,
  allEdges,
  mainChildIds,
}: {
  canvasW: number;
  canvasH: number;
  allLayoutNodes: LayoutNode[];
  allEdges: Edge[];
  mainChildIds: Set<number>;
}) {
  const baseScale = useRef(1);
  const baseTx = useRef(0);
  const baseTy = useRef(0);
  const animScale = useRef(new Animated.Value(1)).current;
  const animTx = useRef(new Animated.Value(0)).current;
  const animTy = useRef(new Animated.Value(0)).current;
  const pinchBaseScale = useRef(1);
  const pinchBaseTx = useRef(0);
  const pinchBaseTy = useRef(0);
  const panBaseTx = useRef(0);
  const panBaseTy = useRef(0);
  const pinchRef = useRef(null);
  const panRef = useRef(null);

  const onPinchEvent = (event: any) => {
    const e = event.nativeEvent;
    const newScale = Math.min(
      Math.max(pinchBaseScale.current * e.scale, SCALE_MIN),
      SCALE_MAX,
    );
    const canvasX = (e.focalX - pinchBaseTx.current) / pinchBaseScale.current;
    const canvasY = (e.focalY - pinchBaseTy.current) / pinchBaseScale.current;
    animScale.setValue(newScale);
    animTx.setValue(e.focalX - canvasX * newScale);
    animTy.setValue(e.focalY - canvasY * newScale);
  };

  const onPinchStateChange = (event: any) => {
    const e = event.nativeEvent;
    if (e.state === State.BEGAN) {
      pinchBaseScale.current = baseScale.current;
      pinchBaseTx.current = baseTx.current;
      pinchBaseTy.current = baseTy.current;
    }
    if (e.state === State.END || e.state === State.CANCELLED) {
      const newScale = Math.min(
        Math.max(pinchBaseScale.current * e.scale, SCALE_MIN),
        SCALE_MAX,
      );
      const canvasX = (e.focalX - pinchBaseTx.current) / pinchBaseScale.current;
      const canvasY = (e.focalY - pinchBaseTy.current) / pinchBaseScale.current;
      baseScale.current = newScale;
      baseTx.current = e.focalX - canvasX * newScale;
      baseTy.current = e.focalY - canvasY * newScale;
    }
  };

  const onPanEvent = (event: any) => {
    const e = event.nativeEvent;
    animTx.setValue(panBaseTx.current + e.translationX);
    animTy.setValue(panBaseTy.current + e.translationY);
  };

  const onPanStateChange = (event: any) => {
    const e = event.nativeEvent;
    if (e.state === State.BEGAN) {
      panBaseTx.current = baseTx.current;
      panBaseTy.current = baseTy.current;
    }
    if (e.state === State.END || e.state === State.CANCELLED) {
      baseTx.current = panBaseTx.current + e.translationX;
      baseTy.current = panBaseTy.current + e.translationY;
    }
  };

  return (
    <View style={{ flex: 1, overflow: "hidden" }}>
      <PanGestureHandler
        ref={panRef}
        onGestureEvent={onPanEvent}
        onHandlerStateChange={onPanStateChange}
        simultaneousHandlers={[pinchRef]}
        minPointers={1}
        maxPointers={1}
      >
        <Animated.View style={StyleSheet.absoluteFill}>
          <PinchGestureHandler
            ref={pinchRef}
            onGestureEvent={onPinchEvent}
            onHandlerStateChange={onPinchStateChange}
            simultaneousHandlers={[panRef]}
          >
            <Animated.View style={StyleSheet.absoluteFill}>
              <Animated.View
                style={{
                  width: canvasW,
                  height: canvasH,
                  transform: [
                    { translateX: animTx },
                    { translateY: animTy },
                    { scale: animScale },
                  ],
                }}
              >
                {allEdges.map((e, i) => (
                  <ConnectorLine key={i} {...e} />
                ))}
                {allLayoutNodes.map((ln) => (
                  <NodeCard key={ln.node.id} ln={ln} />
                ))}{" "}
              </Animated.View>
            </Animated.View>
          </PinchGestureHandler>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
}

// ── MetaHeader ──────────────────────────────────────────────────

function MetaHeader({ thought }: { thought: Thought | null }) {
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
      <Text style={styles.metaTitle}>
        {thought?.title?.trim() ? thought.title : "（タイトルなし）"}
      </Text>
      {thought && <Text style={styles.metaDate}>{fmt(thought.createdAt)}</Text>}
    </View>
  );
}

// ── メイン画面 ──────────────────────────────────────────────────

export default function ThoughtViewScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { thoughtId } = route.params;

  const [thought, setThought] = useState<Thought | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#a78bfa" />
      </View>
    );
  }

  const childMap: Record<number, Node[]> = {};
  for (const n of nodes) {
    if (n.parentId != null) (childMap[n.parentId] ??= []).push(n);
  }
  const rootNodes = nodes.filter((n) => n.parentId == null);

  if (rootNodes.length === 0) {
    return (
      <View style={styles.container}>
        <MetaHeader thought={thought} />
        <View style={styles.center}>
          <Text style={styles.emptyText}>ノードがありません</Text>
        </View>
      </View>
    );
  }

  // ルートは1件のみ想定（本筋の起点）
  const centerX = Math.max(NODE_W / 2 + PADDING, SCREEN.width / 2);
  // rootNodesをcreatedAt順にソートして縦1本に並べる
  const sortedRoots = rootNodes
    .slice()
    .sort((a, b) => a.createdAt - b.createdAt);

  // 各rootNodeを縦に配置、子（分岐）は右展開
  let curY = PADDING;
  const allLayoutNodes: LayoutNode[] = [];
  const allEdges: Edge[] = [];

  for (let i = 0; i < sortedRoots.length; i++) {
    const rn = sortedRoots[i];
    const tree = assignPositions(rn, centerX, curY, childMap);
    const treeNodes = flattenTree(tree);
    const treeEdges = flattenEdges(tree);
    allLayoutNodes.push(...treeNodes);
    allEdges.push(...treeEdges);

    // 本筋の縦線（次のrootNodeへ）
    if (i < sortedRoots.length - 1) {
      const nextY = curY + NODE_H + V_GAP;
      allEdges.push({
        px: centerX,
        py: curY + NODE_H,
        cx: centerX,
        cy: nextY,
      });
      curY = nextY;
    } else {
      curY = curY + NODE_H + V_GAP;
    }
  }

  const mainChildIds = new Set<number>(); // rootNodeはフラットなので本筋IDは不要

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
        <MetaHeader thought={thought} />
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
        mainChildIds={mainChildIds}
      />
    </GestureHandlerRootView>
  );
}

// ── スタイル ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#080c18" },
  headerLayer: { zIndex: 10, elevation: 10, backgroundColor: "#0d1225" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { color: "#64748b", fontSize: 14 },
  metaCard: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(167,139,250,0.2)",
  },
  metaTitle: { fontSize: 17, fontWeight: "700", color: "#e2e8f0" },
  metaDate: { fontSize: 12, color: "#64748b", marginTop: 4 },
  hint: {
    alignItems: "center",
    paddingVertical: 4,
    backgroundColor: "rgba(167,139,250,0.08)",
  },
  hintText: { fontSize: 11, color: "#a78bfa" },
});

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
