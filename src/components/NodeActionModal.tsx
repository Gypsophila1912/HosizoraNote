import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useState, useEffect } from "react";

export type NodeAction = "edit" | "delete" | "moveUp" | "moveDown" | "close";

type Props = {
  visible: boolean;
  initialText: string;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onAction: (action: NodeAction, newText?: string) => void;
};

export default function NodeActionModal({
  visible,
  initialText,
  canMoveUp,
  canMoveDown,
  onAction,
}: Props) {
  const [mode, setMode] = useState<"menu" | "edit">("menu");
  const [editText, setEditText] = useState(initialText);

  // モーダルが開くたびにリセット
  useEffect(() => {
    if (visible) {
      setMode("menu");
      setEditText(initialText);
    }
  }, [visible, initialText]);

  const handleEditSave = () => {
    if (!editText.trim()) return;
    onAction("edit", editText.trim());
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={() => onAction("close")}
        />

        <View style={styles.card}>
          {mode === "menu" ? (
            <>
              <Text style={styles.title}>ノードの操作</Text>

              {/* 移動ボタン */}
              <View style={styles.moveRow}>
                <TouchableOpacity
                  style={[styles.moveBtn, !canMoveUp && styles.moveBtnDisabled]}
                  onPress={() => canMoveUp && onAction("moveUp")}
                  activeOpacity={canMoveUp ? 0.7 : 1}
                >
                  <Text style={[styles.moveBtnText, !canMoveUp && styles.moveBtnTextDisabled]}>
                    ▲ 上へ
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.moveBtn, !canMoveDown && styles.moveBtnDisabled]}
                  onPress={() => canMoveDown && onAction("moveDown")}
                  activeOpacity={canMoveDown ? 0.7 : 1}
                >
                  <Text style={[styles.moveBtnText, !canMoveDown && styles.moveBtnTextDisabled]}>
                    ▼ 下へ
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.divider} />

              {/* 編集ボタン */}
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => setMode("edit")}
              >
                <Text style={styles.actionBtnText}>✎ 編集</Text>
              </TouchableOpacity>

              {/* 削除ボタン */}
              <TouchableOpacity
                style={[styles.actionBtn, styles.deleteBtn]}
                onPress={() => onAction("delete")}
              >
                <Text style={styles.deleteBtnText}>🗑 削除</Text>
              </TouchableOpacity>

              {/* キャンセル */}
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => onAction("close")}
              >
                <Text style={styles.cancelBtnText}>キャンセル</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.title}>内容を編集</Text>
              <TextInput
                style={styles.editInput}
                value={editText}
                onChangeText={setEditText}
                multiline
                autoFocus
                placeholderTextColor="#475569"
                placeholder="テキストを入力..."
              />
              <View style={styles.editActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setMode("menu")}
                >
                  <Text style={styles.cancelBtnText}>戻る</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={handleEditSave}
                >
                  <Text style={styles.saveBtnText}>保存</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  card: {
    backgroundColor: "#0d1225",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 36,
    borderTopWidth: 1,
    borderColor: "rgba(167,139,250,0.3)",
    gap: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: "#a78bfa",
    textAlign: "center",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  moveRow: {
    flexDirection: "row",
    gap: 10,
  },
  moveBtn: {
    flex: 1,
    backgroundColor: "rgba(167,139,250,0.15)",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.3)",
  },
  moveBtnDisabled: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderColor: "rgba(255,255,255,0.08)",
  },
  moveBtnText: {
    color: "#a78bfa",
    fontSize: 14,
    fontWeight: "600",
  },
  moveBtnTextDisabled: {
    color: "#334155",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(167,139,250,0.15)",
    marginVertical: 2,
  },
  actionBtn: {
    backgroundColor: "rgba(167,139,250,0.1)",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.2)",
  },
  actionBtnText: {
    color: "#e2e8f0",
    fontSize: 15,
    fontWeight: "600",
  },
  deleteBtn: {
    backgroundColor: "rgba(239,68,68,0.1)",
    borderColor: "rgba(239,68,68,0.25)",
  },
  deleteBtnText: {
    color: "#f87171",
    fontSize: 15,
    fontWeight: "600",
  },
  cancelBtn: {
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelBtnText: {
    color: "#64748b",
    fontSize: 14,
  },
  editInput: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.25)",
    padding: 14,
    fontSize: 16,
    color: "#e2e8f0",
    minHeight: 100,
    textAlignVertical: "top",
  },
  editActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  saveBtn: {
    backgroundColor: "#a78bfa",
    borderRadius: 10,
    paddingHorizontal: 28,
    paddingVertical: 12,
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
});
