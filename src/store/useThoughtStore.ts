import { create } from "zustand";
import { Node } from "@/db/repositories/nodeRepository";

type ThoughtStore = {
  // 作業中のthought
  currentThoughtId: number | null;
  title: string;
  nodes: Node[];

  // actions
  setCurrentThoughtId: (id: number | null) => void;
  setTitle: (title: string) => void;
  setNodes: (nodes: Node[]) => void;
  reset: () => void;
};

export const useThoughtStore = create<ThoughtStore>((set) => ({
  currentThoughtId: null,
  title: "",
  nodes: [],

  setCurrentThoughtId: (id) => set({ currentThoughtId: id }),
  setTitle: (title) => set({ title }),
  setNodes: (nodes) => set({ nodes }),
  reset: () => set({ currentThoughtId: null, title: "", nodes: [] }),
}));
