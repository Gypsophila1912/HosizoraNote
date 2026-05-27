import {
  View,
  Text,
  Animated,
  PanResponder,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useRef, useState } from "react";
import { Node } from "@/db/repositories/nodeRepository";
import NodeActionModal, { NodeAction } from "@/components/NodeActionModal";

type Props = {
  item: Node;
  tagColor?: string | null;
  tagName?: string | null;
  onSwipeLeft: (node: Node) => void;
  onEdit: (node: Node, newText: string) => void;
  onDelete: (node: Node) => void;
  onMoveUp: (node: Node) => void;
  onMoveDown: (node: Node) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
};

export default function ChildMessageBubble({
  item,
  tagColor,
  tagName,
  onSwipeLeft,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: Props) {
  const translateX = useRef(new Animated.Value(0)).current;
  const triggered = useRef(false);
  const [modalVisible, setModalVisible] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dx) > 8 && Math.abs(gs.dx) > Math.abs(gs.dy) * 1.5,
      onPanResponderMove: (_, gs) => {
        if (gs.dx < 0) translateX.setValue(Math.max(gs.dx, -80));
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dx < -50 && !triggered.current) {
          triggered.current = true;
          Animated.timing(translateX, {
            toValue: -80,
            duration: 100,
            useNativeDriver: true,
          }).start(() => {
            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: true,
            }).start(() => {
              triggered.current = false;
            });
            onSwipeLeft(item);
          });
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    }),
  ).current;

  const handleAction = (action: NodeAction, newText?: string) => {
    setModalVisible(false);
    if (action === "edit" && newText) onEdit(item, newText);
    else if (action === "delete") onDelete(item);
    else if (action === "moveUp") onMoveUp(item);
    else if (action === "moveDown") onMoveDown(item);
  };

  return (
    <>
      <View style={styles.swipeRow}>
        <View style={styles.swipeHint}>
          <Text style={styles.swipeHintText}>分岐</Text>
        </View>
        <Animated.View
          style={{ transform: [{ translateX }], alignSelf: "stretch" }}
          {...panResponder.panHandlers}
        >
          <TouchableOpacity
            activeOpacity={0.85}
            onLongPress={() => setModalVisible(true)}
            delayLongPress={400}
          >
            <View style={[
              styles.messageBubble,
              tagColor ? {
                borderLeftWidth: 4,
                borderLeftColor: tagColor,
              } : null,
            ]}>
              {tagColor && tagName ? (
                <View style={[styles.tagBadge, { backgroundColor: `${tagColor}20` }]}>
                  <View style={[styles.tagDot, { backgroundColor: tagColor }]} />
                  <Text style={[styles.tagBadgeText, { color: tagColor }]}>{tagName}</Text>
                </View>
              ) : null}
              <Text style={styles.messageText}>{item.text}</Text>
              <View style={styles.messageMeta}>
                <Text style={styles.messageTime}>
                  {new Date(item.createdAt).toLocaleTimeString("ja-JP", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </View>

      <NodeActionModal
        visible={modalVisible}
        initialText={item.text}
        canMoveUp={canMoveUp}
        canMoveDown={canMoveDown}
        onAction={handleAction}
      />
    </>
  );
}

const styles = StyleSheet.create({
  swipeRow: { position: "relative", marginBottom: 8, overflow: "hidden" },
  swipeHint: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 64,
    backgroundColor: "#7c3aed",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  swipeHintText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  messageBubble: {
    backgroundColor: "#0f1629",
    borderRadius: 16,
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 12,
    alignSelf: "stretch",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.2)",
  },
  messageText: { fontSize: 16, color: "#e2e8f0" },
  messageMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 4,
    gap: 8,
    alignSelf: "flex-end",
  },
  messageTime: { fontSize: 11, color: "#64748b" },
  tagBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 6,
    gap: 5,
  },
  tagDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  tagBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
});
