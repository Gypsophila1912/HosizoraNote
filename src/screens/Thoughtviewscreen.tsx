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

// ── ツリーレイアウト計算 ────────────────────────────────────────

type LayoutNode = { node: Node; x: number; y: number; children: LayoutNode[] };
type Edge = { px: number; py: number; cx: number; cy: number };

function subtreeWidth(
  nodeId: number,
  childMap: Record<number, Node[]>,
): number {
  const children = childMap[nodeId] ?? [];
  if (children.length === 0) return NODE_W;
  return Math.max(
    NODE_W,
    children.reduce(
      (sum, c) => sum + subtreeWidth(c.id, childMap) + H_GAP,
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
  const children = childMap[node.id] ?? [];
  const totalW = children.reduce(
    (sum, c) => sum + subtreeWidth(c.id, childMap) + H_GAP,
    -H_GAP,
  );
  let curX = centerX - totalW / 2;
  const childY = topY + NODE_H + V_GAP;
  const layoutChildren = children.map((c) => {
    const cw = subtreeWidth(c.id, childMap);
    const cx2 = curX + cw / 2;
    curX += cw + H_GAP;
    return assignPositions(c, cx2, childY, childMap);
  });
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

// ── 折れ線コネクター ────────────────────────────────────────────

function ConnectorLine({ px, py, cx, cy }: Edge) {
  const midY = (py + cy) / 2;
  const left = Math.min(px, cx);
  const lineW = Math.abs(px - cx);
  const COLOR = "#C5CAE9";
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

// ── ZoomableCanvas ──────────────────────────────────────────────

function ZoomableCanvas({
  canvasW,
  canvasH,
  allLayoutNodes,
  allEdges,
}: {
  canvasW: number;
  canvasH: number;
  allLayoutNodes: LayoutNode[];
  allEdges: Edge[];
}) {
  // 確定値（ジェスチャー終了後に保存）
  const baseScale = useRef(1);
  const baseTx = useRef(0);
  const baseTy = useRef(0);

  // Animated.Value（描画用）
  const animScale = useRef(new Animated.Value(1)).current;
  const animTx = useRef(new Animated.Value(0)).current;
  const animTy = useRef(new Animated.Value(0)).current;

  // ピンチ開始時の確定値スナップショット
  const pinchBaseScale = useRef(1);
  const pinchBaseTx = useRef(0);
  const pinchBaseTy = useRef(0);

  // パン開始時のスナップショット
  const panBaseTx = useRef(0);
  const panBaseTy = useRef(0);

  const pinchRef = useRef(null);
  const panRef = useRef(null);

  // ── ピンチハンドラー ──
  const onPinchEvent = (event: any) => {
    const e = event.nativeEvent;
    // e.scale    : 開始時からの累積スケール倍率
    // e.focalX/Y : 指の中点（スクリーン座標）
    const newScale = Math.min(
      Math.max(pinchBaseScale.current * e.scale, SCALE_MIN),
      SCALE_MAX,
    );

    // focalX/Y のスクリーン座標がキャンバス上のどこか（ピンチ開始時の変換で）
    const canvasX = (e.focalX - pinchBaseTx.current) / pinchBaseScale.current;
    const canvasY = (e.focalY - pinchBaseTy.current) / pinchBaseScale.current;

    // 新スケールで同じキャンバス座標が focalX/Y に来るようオフセット算出
    const newTx = e.focalX - canvasX * newScale;
    const newTy = e.focalY - canvasY * newScale;

    animScale.setValue(newScale);
    animTx.setValue(newTx);
    animTy.setValue(newTy);
  };

  const onPinchStateChange = (event: any) => {
    const e = event.nativeEvent;
    if (e.state === State.BEGAN) {
      // ピンチ開始時の確定値を保存
      pinchBaseScale.current = baseScale.current;
      pinchBaseTx.current = baseTx.current;
      pinchBaseTy.current = baseTy.current;
    }
    if (e.state === State.END || e.state === State.CANCELLED) {
      // 確定値を更新
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

  // ── パンハンドラー ──
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
                ))}
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
        <ActivityIndicator color="#5C6BC0" />
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

  let curY = PADDING;
  const rootTrees: LayoutNode[] = [];
  for (const rn of rootNodes) {
    const sw = subtreeWidth(rn.id, childMap);
    const centerX = Math.max(sw / 2 + PADDING, SCREEN.width / 2);
    const tree = assignPositions(rn, centerX, curY, childMap);
    rootTrees.push(tree);
    const maxY = Math.max(...flattenTree(tree).map((ln) => ln.y + NODE_H));
    curY = maxY + V_GAP * 2;
  }

  const allLayoutNodes = rootTrees.flatMap(flattenTree);
  const allEdges = rootTrees.flatMap(flattenEdges);
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
      />
    </GestureHandlerRootView>
  );
}

// ── スタイル ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f0f8" },
  headerLayer: { zIndex: 10, elevation: 10, backgroundColor: "#fff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { color: "#9E9E9E", fontSize: 14 },
  metaCard: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  metaTitle: { fontSize: 17, fontWeight: "700", color: "#212121" },
  metaDate: { fontSize: 12, color: "#9E9E9E", marginTop: 4 },
  hint: {
    alignItems: "center",
    paddingVertical: 4,
    backgroundColor: "#EDE7F6",
  },
  hintText: { fontSize: 11, color: "#7986CB" },
});

const card = StyleSheet.create({
  box: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#E8EAF6",
    justifyContent: "space-between",
  },
  rootBox: { backgroundColor: "#5C6BC0", borderColor: "#3949AB" },
  text: { fontSize: 12, color: "#212121", lineHeight: 16 },
  rootText: { color: "#fff", fontWeight: "600" },
  time: { fontSize: 10, color: "#9E9E9E", alignSelf: "flex-end" },
  rootTime: { color: "#C5CAE9" },
});
