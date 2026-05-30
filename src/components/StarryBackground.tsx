import { useEffect, useRef, useMemo } from "react";
import { View, Animated, Easing, StyleSheet, Dimensions } from "react-native";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

const STAR_COUNT = 50;

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  baseOpacity: number;
  duration: number;
  delay: number;
}

function generateStars(): Star[] {
  const stars: Star[] = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      id: i,
      x: Math.random() * SCREEN_W,
      y: Math.random() * SCREEN_H * 1.2,
      size: 1 + Math.random() * 2,
      baseOpacity: 0.15 + Math.random() * 0.45,
      duration: 2000 + Math.random() * 4000,
      delay: Math.random() * 3000,
    });
  }
  return stars;
}

export default function StarryBackground() {
  const stars = useMemo(() => generateStars(), []);
  const anims = useRef(stars.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const runningAnims: Animated.CompositeAnimation[] = [];

    stars.forEach((star, i) => {
      // 初回のディレイ後にループ開始
      const timeout = setTimeout(() => {
        const loop = Animated.loop(
          Animated.sequence([
            Animated.timing(anims[i], {
              toValue: 1,
              duration: star.duration / 2,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(anims[i], {
              toValue: 0,
              duration: star.duration / 2,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ])
        );
        runningAnims.push(loop);
        loop.start();
      }, star.delay);

      // クリーンアップ用にタイムアウトIDも保持
      (runningAnims as any).__timeouts = (runningAnims as any).__timeouts || [];
      (runningAnims as any).__timeouts.push(timeout);
    });

    return () => {
      runningAnims.forEach((a) => a.stop());
      ((runningAnims as any).__timeouts || []).forEach((t: ReturnType<typeof setTimeout>) =>
        clearTimeout(t)
      );
    };
  }, []);

  return (
    <View style={styles.container} pointerEvents="none">
      {stars.map((star, i) => {
        const opacity = anims[i].interpolate({
          inputRange: [0, 1],
          outputRange: [star.baseOpacity * 0.3, star.baseOpacity],
        });

        return (
          <Animated.View
            key={star.id}
            style={[
              styles.star,
              {
                left: star.x,
                top: star.y,
                width: star.size,
                height: star.size,
                borderRadius: star.size / 2,
                opacity,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  star: {
    position: "absolute",
    backgroundColor: "#fff",
  },
});
