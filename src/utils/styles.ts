import { StyleSheet } from "react-native";
import { Colors, Spacing } from "../constants";

export const commonStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  card: {
    padding: Spacing.md,
    borderRadius: 8,
    backgroundColor: Colors.background,
  },
});
