import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { getAllTags, Tag } from "@/db/repositories/tagRepository";

type Props = {
  selectedTagId: number | null;
  onSelectTag: (tagId: number | null) => void;
};

export default function TagSelector({ selectedTagId, onSelectTag }: Props) {
  const [tags, setTags] = useState<Tag[]>([]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const result = await getAllTags();
          setTags(result);
        } catch {
          // Web mock
        }
      })();
    }, []),
  );

  if (tags.length === 0) return null;

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* 「なし」ボタン */}
        <TouchableOpacity
          style={[
            styles.tag,
            selectedTagId === null && styles.tagSelected,
          ]}
          onPress={() => onSelectTag(null)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tagText,
              selectedTagId === null && styles.tagTextSelected,
            ]}
          >
            なし
          </Text>
        </TouchableOpacity>

        {tags.map((tag) => {
          const isSelected = selectedTagId === tag.id;
          return (
            <TouchableOpacity
              key={tag.id}
              style={[
                styles.tag,
                { borderColor: tag.color },
                isSelected && { backgroundColor: tag.color },
              ]}
              onPress={() => onSelectTag(isSelected ? null : tag.id)}
              activeOpacity={0.7}
            >
              <View
                style={[styles.dot, { backgroundColor: tag.color }]}
              />
              <Text
                style={[
                  styles.tagText,
                  isSelected && styles.tagTextActive,
                ]}
              >
                {tag.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#0d1225",
    borderTopWidth: 1,
    borderTopColor: "rgba(34,211,238,0.1)",
    paddingVertical: 6,
  },
  scroll: {
    paddingHorizontal: 12,
    gap: 8,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    gap: 5,
  },
  tagSelected: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderColor: "rgba(255,255,255,0.25)",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 13,
    color: "#94a3b8",
    fontWeight: "500",
  },
  tagTextSelected: {
    color: "#e2e8f0",
  },
  tagTextActive: {
    color: "#fff",
    fontWeight: "700",
  },
});
