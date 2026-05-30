import React from "react";
import { View, StyleSheet } from "react-native";

// 画面端をぐるっと囲む静的な白い霧（ビネット）エフェクト
export default function ThinkingFog() {
  return (
    <View style={styles.container} pointerEvents="none">
      <View style={[styles.fogLayer, { borderWidth: 50, borderColor: "rgba(255,255,255,0.015)" }]} />
      <View style={[styles.fogLayer, { borderWidth: 40, borderColor: "rgba(255,255,255,0.02)" }]} />
      <View style={[styles.fogLayer, { borderWidth: 30, borderColor: "rgba(255,255,255,0.03)" }]} />
      <View style={[styles.fogLayer, { borderWidth: 20, borderColor: "rgba(255,255,255,0.04)" }]} />
      <View style={[styles.fogLayer, { borderWidth: 10, borderColor: "rgba(255,255,255,0.06)" }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  fogLayer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 60, // 角に少し多めに霧が溜まるように丸みをつける
  },
});
