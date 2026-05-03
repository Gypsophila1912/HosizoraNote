import { useCallback } from "react";
import { useThoughtStore } from "@/store/useThoughtStore";
import {
  createThought,
  updateThoughtTitle,
  deleteThought,
} from "@/db/repositories/thoughtRepository";
import {
  addNode,
  getNodesByThoughtId,
  getChildNodes,
  getNodeById,
  deleteNodesByThoughtId,
  Node,
} from "@/db/repositories/nodeRepository";

export const useThought = () => {
  const {
    currentThoughtId,
    title,
    nodes,
    selectedNodeId,
    setCurrentThoughtId,
    setTitle,
    setNodes,
    setSelectedNodeId,
    reset,
  } = useThoughtStore();

  const ensureThought = useCallback(async (): Promise<number> => {
    if (currentThoughtId) {
      await updateThoughtTitle(currentThoughtId, title);
      return currentThoughtId;
    }
    const id = await createThought(title);
    setCurrentThoughtId(id);
    return id;
  }, [currentThoughtId, title, setCurrentThoughtId]);

  /** ルートレベルへのメッセージ送信（HomeScreen用） */
  const sendMessage = useCallback(
    async (text: string, parentId?: number) => {
      if (!text.trim()) return;
      const thoughtId = await ensureThought();
      await addNode(thoughtId, text, parentId);
      const updated = await getNodesByThoughtId(thoughtId);
      setNodes(updated);
    },
    [ensureThought, setNodes],
  );

  /**
   * DetailScreen用: parentNodeIdの子として返信を追加し、
   * そのparentNodeId以下のスレッドノードを返す
   */
  const replyToNode = useCallback(
    async (
      thoughtId: number,
      parentNodeId: number,
      text: string,
    ): Promise<Node[]> => {
      if (!text.trim()) return [];
      await addNode(thoughtId, text, parentNodeId);
      const children = await getChildNodes(parentNodeId);
      return children;
    },
    [],
  );

  /** DetailScreen用: parentNodeIdの子ノード一覧を取得 */
  const loadChildNodes = useCallback(
    async (parentNodeId: number): Promise<Node[]> => {
      return await getChildNodes(parentNodeId);
    },
    [],
  );

  /** DetailScreen用: ノード単体を取得（親ノード表示） */
  const loadNodeById = useCallback(async (id: number): Promise<Node | null> => {
    return await getNodeById(id);
  }, []);

  const changeTitle = useCallback(
    async (newTitle: string) => {
      setTitle(newTitle);
      if (currentThoughtId) {
        await updateThoughtTitle(currentThoughtId, newTitle);
      }
    },
    [currentThoughtId, setTitle],
  );

  const complete = useCallback(async () => {
    if (currentThoughtId) {
      await updateThoughtTitle(currentThoughtId, title);
    }
    reset();
  }, [currentThoughtId, title, reset]);

  const resetThought = useCallback(async () => {
    if (currentThoughtId) {
      await deleteNodesByThoughtId(currentThoughtId);
      await deleteThought(currentThoughtId);
    }
    reset();
  }, [currentThoughtId, reset]);

  return {
    title,
    nodes,
    selectedNodeId,
    setSelectedNodeId,
    changeTitle,
    sendMessage,
    replyToNode,
    loadChildNodes,
    loadNodeById,
    complete,
    resetThought,
    currentThoughtId,
  };
};
