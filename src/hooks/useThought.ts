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
  getThreadChain,
  getNodeById,
  deleteNodesByThoughtId,
  updateNodeText,
  deleteNode,
  updateNodeOrders,
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
  // useThought.ts

  const sendMessage = useCallback(
    async (text: string, parentId?: number, tagId?: number | null) => {
      if (!text.trim()) return;
      const thoughtId = await ensureThought();
      await addNode(thoughtId, text, parentId ?? undefined, tagId);
      const updated = await getNodesByThoughtId(thoughtId);
      setNodes(updated);
    },
    [ensureThought, setNodes],
  );

  /**
   * DetailScreen用: exactParentId の直接の子として返信を追加し、
   * 新しく作成されたノードを返す
   */
  const replyToNode = useCallback(
    async (
      thoughtId: number,
      exactParentId: number,
      text: string,
      tagId?: number | null,
    ): Promise<Node | null> => {
      if (!text.trim()) return null;
      const newNode = await addNode(thoughtId, text, exactParentId, tagId);
      const updated = await getNodesByThoughtId(thoughtId);
      setNodes(updated);
      return newNode;
    },
    [setNodes],
  );

  /** DetailScreen用: parentNodeIdから始まる直列チェーンを取得 */
  const loadChildNodes = useCallback(
    async (parentNodeId: number, includeStartNode = false): Promise<Node[]> => {
      return await getThreadChain(parentNodeId, includeStartNode);
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

  /** HomeScreen用: ルートノードのテキスト編集 */
  const editNode = useCallback(
    async (nodeId: number, newText: string) => {
      await updateNodeText(nodeId, newText);
      if (!currentThoughtId) return;
      const updated = await getNodesByThoughtId(currentThoughtId);
      setNodes(updated);
    },
    [currentThoughtId, setNodes],
  );

  /** HomeScreen用: ルートノード削除 */
  const removeNode = useCallback(
    async (nodeId: number) => {
      await deleteNode(nodeId);
      if (!currentThoughtId) return;
      const updated = await getNodesByThoughtId(currentThoughtId);
      setNodes(updated);
    },
    [currentThoughtId, setNodes],
  );

  /**
   * 同一スコープのノードリスト内で index を上下に移動する汎用ヘルパー。
   * createdAt の値を入れ替えることで並び順を永続化する。
   * 更新後のリストを返す。
   */
  const reorderNodes = useCallback(
    async (sortedNodes: Node[], fromIndex: number, toIndex: number): Promise<Node[]> => {
      if (fromIndex === toIndex) return sortedNodes;
      const arr = [...sortedNodes];
      const [moved] = arr.splice(fromIndex, 1);
      arr.splice(toIndex, 0, moved);

      // createdAt を連番で振り直して順序を確定する
      const base = Math.min(...arr.map((n) => n.createdAt));
      const withCreatedAt = arr.map((n, i) => ({
        id: n.id,
        createdAt: base + i,
      }));
      await updateNodeOrders(withCreatedAt);

      const reordered = arr.map((n, i) => ({ ...n, createdAt: base + i }));
      return reordered;
    },
    [],
  );

  const refreshNodes = useCallback(async () => {
    if (currentThoughtId) {
      const updated = await getNodesByThoughtId(currentThoughtId);
      setNodes(updated);
    }
  }, [currentThoughtId, setNodes]);

  return {
    currentThoughtId,
    title,
    nodes,
    selectedNodeId,
    changeTitle,
    sendMessage,
    replyToNode,
    loadChildNodes,
    loadNodeById,
    complete,
    resetThought,
    editNode,
    removeNode,
    reorderNodes,
    setSelectedNodeId,
    refreshNodes,
  };
};
