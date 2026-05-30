import { View, StyleSheet } from "react-native";

type Edge = { px: number; py: number; cx: number; cy: number; isMain?: boolean };

export default function ConnectorLine({ px, py, cx, cy, isMain }: Edge) {
  const midY = (py + cy) / 2;
  const left = Math.min(px, cx);
  const lineW = Math.abs(px - cx);
  
  const COLOR = isMain ? "rgba(34,211,238,0.8)" : "rgba(34,211,238,0.3)";
  const T = isMain ? 3 : 1.5;
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
