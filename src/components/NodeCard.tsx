import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Node } from "@/db/repositories/nodeRepository";

export const NODE_W = 140;
export const NODE_H = 72;

export type LayoutNode = {
  node: Node;
  x: number;
  y: number;
  children: LayoutNode[];
};

type Props = { 
  ln: LayoutNode; 
  tagColorMap?: Record<number, string>;
  isDeleteMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (nodeId: number) => void;
  onEditSave?: (nodeId: number, newText: string) => void;
};

export default function NodeCard({
  ln,
  tagColorMap,
  isDeleteMode,
  isSelected,
  onToggleSelect,
  onEditSave,
}: Props) {
  const { node, x, y } = ln;
  const isRoot = node.parentId == null;
  const tagColor = node.tagId && tagColorMap ? tagColorMap[node.tagId] : null;

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(node.text);

  const handleSave = () => {
    setIsEditing(false);
    if (editText.trim() !== node.text) {
      onEditSave?.(node.id, editText.trim() || node.text);
    } else {
      setEditText(node.text);
    }
  };

  return (
    <View
      style={[
        card.box,
        {
          position: "absolute",
          left: x - NODE_W / 2,
          top: y,
          width: NODE_W,
          height: NODE_H,
        },
        isRoot && card.rootBox,
        tagColor ? { 
          backgroundColor: `${tagColor}25`,
          borderColor: tagColor,
          borderWidth: 1.5,
          borderLeftWidth: 4,
          borderLeftColor: tagColor,
        } : null,
        isSelected && { borderColor: "#ef4444", backgroundColor: "rgba(239, 68, 68, 0.15)", borderWidth: 2 }
      ]}
    >
      {isDeleteMode && (
        <TouchableOpacity 
          style={card.checkboxLayer} 
          onPress={() => onToggleSelect?.(node.id)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isSelected ? "checkmark-circle" : "ellipse-outline"}
            size={24}
            color={isSelected ? "#ef4444" : "#64748b"}
          />
        </TouchableOpacity>
      )}

      {!isDeleteMode && !isEditing && (
        <TouchableOpacity
          style={card.editButton}
          onPress={() => {
            setEditText(node.text);
            setIsEditing(true);
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="pencil" size={14} color="#22d3ee" />
        </TouchableOpacity>
      )}

      {isEditing ? (
        <TextInput
          style={[card.text, isRoot && card.rootText, card.input]}
          value={editText}
          onChangeText={setEditText}
          onBlur={handleSave}
          autoFocus
          multiline
        />
      ) : (
        <Text style={[card.text, isRoot && card.rootText]} numberOfLines={3}>
          {node.text}
        </Text>
      )}
      <Text style={[card.time, isRoot && card.rootTime]}>
        {new Date(node.createdAt).toLocaleTimeString("ja-JP", {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </Text>
    </View>
  );
}

const card = StyleSheet.create({
  box: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.2)",
    justifyContent: "space-between",
  },
  mainBox: {
    backgroundColor: "rgba(34,211,238,0.15)",
    borderColor: "rgba(34,211,238,0.5)",
  },
  rootBox: {
    backgroundColor: "rgba(34,211,238,0.35)",
    borderColor: "#67e8f9",
    borderWidth: 3,
    shadowColor: "#22d3ee",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  text: { fontSize: 12, color: "#e2e8f0", lineHeight: 16 },
  mainText: { color: "#fff" },
  rootText: { color: "#fff", fontWeight: "600" },
  input: {
    backgroundColor: "rgba(0,0,0,0.3)",
    padding: 4,
    borderRadius: 4,
    flex: 1,
  },
  time: { fontSize: 10, color: "#64748b", alignSelf: "flex-end" },
  mainTime: { color: "#67e8f9" },
  rootTime: { color: "#67e8f9" },
  editButton: {
    position: "absolute",
    top: 4,
    right: 4,
    padding: 4,
    zIndex: 10,
  },
  checkboxLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 10,
    zIndex: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
