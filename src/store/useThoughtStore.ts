import { create } from "zustand";
import { Node } from "@/db/repositories/nodeRepository";

type ThoughtStore = {
  currentThoughtId: number | null;
  title: string;
  nodes: Node[];
  /** 左スワイプで選択したノード（返信先・分岐元） */
  selectedNodeId: number | null;

  setCurrentThoughtId: (id: number | null) => void;
  setTitle: (title: string) => void;
  setNodes: (nodes: Node[]) => void;
  setSelectedNodeId: (id: number | null) => void;
  reset: () => void;
};

export const useThoughtStore = create<ThoughtStore>((set) => ({
  currentThoughtId: null,
  title: "",
  nodes: [],
  selectedNodeId: null,

  setCurrentThoughtId: (id) => set({ currentThoughtId: id }),
  setTitle: (title) => set({ title }),
  setNodes: (nodes) => set({ nodes }),
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
  reset: () =>
    set({ currentThoughtId: null, title: "", nodes: [], selectedNodeId: null }),
}));
