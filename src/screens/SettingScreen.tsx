import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useSettingsStore } from "@/store/useSettingsStore";
import {
  getAllTags,
  createTag,
  updateTag,
  deleteTag,
  Tag,
} from "@/db/repositories/tagRepository";

/* ── 選択可能なカラーパレット ── */
const TAG_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#f43f5e", // rose
  "#14b8a6", // teal
];

export default function SettingScreen() {
  const insets = useSafeAreaInsets();
  const { userName, setUserName } = useSettingsStore();

  /* ── 名前の編集状態 ── */
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(userName);

  /* ── タグ一覧 ── */
  const [tags, setTags] = useState<Tag[]>([]);

  /* ── タグ編集モーダル ── */
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [tagNameInput, setTagNameInput] = useState("");
  const [tagColorInput, setTagColorInput] = useState(TAG_COLORS[0]);

  /* ── タグ読み込み ── */
  const loadTags = async () => {
    try {
      const result = await getAllTags();
      setTags(result);
    } catch {
      // Web mock — 空配列のまま
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadTags();
    }, []),
  );

  useEffect(() => {
    setNameInput(userName);
  }, [userName]);

  /* ── 名前の保存 ── */
  const saveName = () => {
    setUserName(nameInput.trim());
    setEditingName(false);
  };

  /* ── タグ追加/編集モーダルを開く ── */
  const openAddTag = () => {
    setEditingTag(null);
    setTagNameInput("");
    setTagColorInput(TAG_COLORS[0]);
    setModalVisible(true);
  };

  const openEditTag = (tag: Tag) => {
    setEditingTag(tag);
    setTagNameInput(tag.name);
    setTagColorInput(tag.color);
    setModalVisible(true);
  };

  /* ── タグ保存 ── */
  const saveTag = async () => {
    const name = tagNameInput.trim();
    if (!name) return;
    try {
      if (editingTag) {
        await updateTag(editingTag.id, name, tagColorInput);
      } else {
        await createTag(name, tagColorInput);
      }
      await loadTags();
      setModalVisible(false);
    } catch {
      Alert.alert("エラー", "タグの保存に失敗しました");
    }
  };

  /* ── タグ削除 ── */
  const confirmDeleteTag = (tag: Tag) => {
    if (Platform.OS === "web") {
      handleDeleteTag(tag.id);
      return;
    }
    Alert.alert("タグを削除", `「${tag.name}」を削除しますか？`, [
      { text: "キャンセル", style: "cancel" },
      {
        text: "削除",
        style: "destructive",
        onPress: () => handleDeleteTag(tag.id),
      },
    ]);
  };

  const handleDeleteTag = async (id: number) => {
    try {
      await deleteTag(id);
      await loadTags();
    } catch {
      Alert.alert("エラー", "タグの削除に失敗しました");
    }
  };

  /* ── アバターのイニシャル ── */
  const initial = userName.trim()
    ? userName.trim()[0].toUpperCase()
    : "?";

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── ヘッダー ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>マイページ</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ══════ プロフィールカード ══════ */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
            {/* 光の輪 */}
            <View style={styles.avatarRing} />
          </View>

          {editingName ? (
            <View style={styles.nameEditRow}>
              <TextInput
                style={styles.nameInput}
                value={nameInput}
                onChangeText={setNameInput}
                placeholder="名前を入力..."
                placeholderTextColor="#475569"
                autoFocus
                onSubmitEditing={saveName}
                returnKeyType="done"
              />
              <TouchableOpacity style={styles.nameSaveBtn} onPress={saveName}>
                <Ionicons name="checkmark" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.nameRow}
              onPress={() => setEditingName(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.nameText}>
                {userName.trim() || "名前を設定する"}
              </Text>
              <Ionicons
                name="pencil-outline"
                size={16}
                color="#64748b"
                style={{ marginLeft: 6 }}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* ══════ カラータグ セクション ══════ */}
        <View style={styles.sectionHeader}>
          <Ionicons name="pricetag" size={18} color="#a78bfa" />
          <Text style={styles.sectionTitle}>カラータグ</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={openAddTag}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={20} color="#a78bfa" />
          </TouchableOpacity>
        </View>

        <View style={styles.tagList}>
          {tags.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="pricetags-outline"
                size={36}
                color="#334155"
              />
              <Text style={styles.emptyText}>
                タグがまだありません
              </Text>
              <Text style={styles.emptySubtext}>
                ＋ボタンからタグを追加しましょう
              </Text>
            </View>
          ) : (
            tags.map((tag) => (
              <TouchableOpacity
                key={tag.id}
                style={styles.tagItem}
                onPress={() => openEditTag(tag)}
                activeOpacity={0.7}
              >
                <View
                  style={[styles.tagColorDot, { backgroundColor: tag.color }]}
                />
                <Text style={styles.tagName}>{tag.name}</Text>
                <TouchableOpacity
                  style={styles.tagDeleteBtn}
                  onPress={() => confirmDeleteTag(tag)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="trash-outline" size={16} color="#64748b" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* ══════ タグ追加/編集 モーダル ══════ */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingTag ? "タグを編集" : "タグを追加"}
            </Text>

            {/* タグ名入力 */}
            <TextInput
              style={styles.modalInput}
              value={tagNameInput}
              onChangeText={setTagNameInput}
              placeholder="例: 仕事、遊び、学習..."
              placeholderTextColor="#475569"
              autoFocus
            />

            {/* カラー選択 */}
            <Text style={styles.modalLabel}>カラーを選択</Text>
            <View style={styles.colorGrid}>
              {TAG_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    tagColorInput === color && styles.colorOptionSelected,
                  ]}
                  onPress={() => setTagColorInput(color)}
                  activeOpacity={0.7}
                >
                  {tagColorInput === color && (
                    <Ionicons name="checkmark" size={18} color="#fff" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* ボタン */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalSaveBtn,
                  !tagNameInput.trim() && styles.modalSaveBtnDisabled,
                ]}
                onPress={saveTag}
                disabled={!tagNameInput.trim()}
              >
                <Text style={styles.modalSaveText}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#080c18",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#0d1225",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(167,139,250,0.2)",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#e2e8f0",
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },

  /* ── プロフィールカード ── */
  profileCard: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.12)",
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#7c3aed",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarRing: {
    position: "absolute",
    top: -4,
    left: -4,
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: "rgba(167,139,250,0.35)",
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  nameText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#e2e8f0",
  },
  nameEditRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: "80%",
  },
  nameInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    color: "#e2e8f0",
    borderBottomWidth: 2,
    borderBottomColor: "#a78bfa",
    paddingVertical: 4,
    textAlign: "center",
  },
  nameSaveBtn: {
    backgroundColor: "#a78bfa",
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },

  /* ── セクション ── */
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#e2e8f0",
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(167,139,250,0.12)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.25)",
  },

  /* ── タグリスト ── */
  tagList: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.12)",
    overflow: "hidden",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "600",
  },
  emptySubtext: {
    fontSize: 12,
    color: "#475569",
  },
  tagItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  tagColorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 12,
  },
  tagName: {
    flex: 1,
    fontSize: 15,
    color: "#e2e8f0",
    fontWeight: "500",
  },
  tagDeleteBtn: {
    padding: 4,
  },

  /* ── モーダル ── */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#0f1629",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.2)",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#e2e8f0",
    marginBottom: 20,
    textAlign: "center",
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.25)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#e2e8f0",
    backgroundColor: "rgba(255,255,255,0.05)",
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#94a3b8",
    marginBottom: 10,
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorOptionSelected: {
    borderColor: "#fff",
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  previewContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
    gap: 10,
  },
  previewDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  previewText: {
    fontSize: 15,
    color: "#e2e8f0",
    fontWeight: "500",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  modalCancelText: {
    fontSize: 15,
    color: "#94a3b8",
    fontWeight: "600",
  },
  modalSaveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#a78bfa",
    alignItems: "center",
  },
  modalSaveBtnDisabled: {
    opacity: 0.4,
  },
  modalSaveText: {
    fontSize: 15,
    color: "#fff",
    fontWeight: "700",
  },
});
