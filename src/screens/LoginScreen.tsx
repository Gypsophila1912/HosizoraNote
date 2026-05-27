import {
  View,
  Text,
  TouchableOpacity,
  ImageBackground,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Image,
} from "react-native";
import { useState } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

const { width, height } = Dimensions.get("window");

export default function LoginScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    setLoading(true);
    // ダミーのログイン処理（実際の認証なし）
    setTimeout(() => {
      setLoading(false);
      navigation.replace("Main");
    }, 800);
  };

  return (
    <ImageBackground
      source={require("../assets/login-bg.png")}
      style={styles.bg}
      resizeMode="cover"
    >
      {/* 背景画像の上に重ねる暗幕 */}
      <View style={styles.overlay} />

      <View style={styles.container}>
        {/* ロゴエリア */}
        <View style={styles.logoArea}>
          {
            <Image
              source={require("../assets/login-logo.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />
          }
        </View>

        {/* ログインボタン */}
        <TouchableOpacity
          onPress={handleLogin}
          activeOpacity={0.8}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Image
              source={require("../assets/login-button.png")}
              style={styles.loginButtonImage}
              resizeMode="contain"
            />
          )}
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    width,
    height,
    backgroundColor: "#0d1225",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10, 10, 40, 0.55)",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    gap: 60,
  },

  // ロゴエリア
  logoArea: {
    alignItems: "center",
  },
  logoImage: {
    width: 320, // ★ ロゴ画像推奨: 640×320px (2x)
    height: 160,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: "#e8e8ff",
    letterSpacing: 1.5,
  },
  appSubtitle: {
    fontSize: 13,
    color: "#9999cc",
    marginTop: 8,
  },

  // ログインボタン（画像がボタン全体。背景・paddingなし）
  loginButtonImage: {
    width: width * 0.75, // 画面幅の75%
    height: width * 0.75 * (120 / 440), // 880×240px の縦横比を維持
  },
});
