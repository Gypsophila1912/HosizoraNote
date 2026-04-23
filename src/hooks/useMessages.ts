import { useState, useEffect, useCallback } from "react";
import {
  getMessages,
  addMessage,
  Message,
} from "@/db/repositories/messageRepository";

export const useMessages = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMessages = useCallback(async () => {
    const data = await getMessages();
    setMessages(data);
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;
      setLoading(true);
      await addMessage(content);
      await fetchMessages();
      setLoading(false);
    },
    [fetchMessages],
  );

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  return { messages, sendMessage, loading };
};
