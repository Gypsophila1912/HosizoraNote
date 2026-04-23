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
  deleteNodesByThoughtId,
} from "@/db/repositories/nodeRepository";

export const useThought = () => {
  const {
    currentThoughtId,
    title,
    nodes,
    setCurrentThoughtId,
    setTitle,
    setNodes,
    reset,
  } = useThoughtStore();

  // thoughtがなければ作成、あれば更新
  const ensureThought = useCallback(async (): Promise<number> => {
    if (currentThoughtId) {
      await updateThoughtTitle(currentThoughtId, title);
      return currentThoughtId;
    }
    const id = await createThought(title);
    setCurrentThoughtId(id);
    return id;
  }, [currentThoughtId, title, setCurrentThoughtId]);

  // メッセージ送信
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;
      const thoughtId = await ensureThought();
      await addNode(thoughtId, text);
      const updated = await getNodesByThoughtId(thoughtId);
      setNodes(updated);
    },
    [ensureThought, setNodes],
  );

  // タイトル変更（DBも更新）
  const changeTitle = useCallback(
    async (newTitle: string) => {
      setTitle(newTitle);
      if (currentThoughtId) {
        await updateThoughtTitle(currentThoughtId, newTitle);
      }
    },
    [currentThoughtId, setTitle],
  );

  // 完了 → 保存済みなのでstoreだけリセット
  const complete = useCallback(async () => {
    if (currentThoughtId) {
      await updateThoughtTitle(currentThoughtId, title);
    }
    reset();
  }, [currentThoughtId, title, reset]);

  // リセット → DBから削除してstoreもリセット
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
    changeTitle,
    sendMessage,
    complete,
    resetThought,
  };
};
