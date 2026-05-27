import { useRef } from "react";
import { View, Animated, StyleSheet } from "react-native";
import {
  GestureHandlerRootView,
  PinchGestureHandler,
  PanGestureHandler,
  State,
} from "react-native-gesture-handler";
import ConnectorLine from "@/components/ConnectorLine";
import NodeCard, { LayoutNode } from "@/components/NodeCard";

const SCALE_MIN = 0.15;
const SCALE_MAX = 6;

type Edge = { px: number; py: number; cx: number; cy: number };

type Props = {
  canvasW: number;
  canvasH: number;
  allLayoutNodes: LayoutNode[];
  allEdges: Edge[];
  mainChildIds: Set<number>;
  tagColorMap?: Record<number, string>;
};

export default function ZoomableCanvas({
  canvasW,
  canvasH,
  allLayoutNodes,
  allEdges,
  tagColorMap,
}: Props) {
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
                  <NodeCard key={ln.node.id} ln={ln} tagColorMap={tagColorMap} />
                ))}
              </Animated.View>
            </Animated.View>
          </PinchGestureHandler>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
}
