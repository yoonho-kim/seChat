"use client";

import { useEffect, useState, useCallback } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";

export interface Message {
  id: string;
  room_id: string;
  sender_role: string;
  sender_name: string;
  client_message_id: string | null;
  content: string;
  created_at: string;
}

function toTimeValue(value: string) {
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function isOptimisticMessage(message: Message) {
  return message.id.startsWith("optimistic-");
}

function sortMessages(messages: Message[]) {
  return [...messages].sort((a, b) => {
    const timeDiff = toTimeValue(a.created_at) - toTimeValue(b.created_at);
    if (timeDiff !== 0) return timeDiff;
    return a.id.localeCompare(b.id);
  });
}

function dedupeMessages(messages: Message[]) {
  const byId = new Map<string, Message>();
  const byClientMessageId = new Map<string, Message>();

  for (const message of sortMessages(messages)) {
    const existingById = byId.get(message.id);
    if (existingById) {
      byId.set(message.id, message);
      if (message.client_message_id) {
        byClientMessageId.set(message.client_message_id, message);
      }
      continue;
    }

    const clientMessageId = message.client_message_id;
    if (!clientMessageId) {
      byId.set(message.id, message);
      continue;
    }

    const existingByClientMessageId = byClientMessageId.get(clientMessageId);
    if (!existingByClientMessageId) {
      byClientMessageId.set(clientMessageId, message);
      byId.set(message.id, message);
      continue;
    }

    const shouldReplace =
      isOptimisticMessage(existingByClientMessageId) && !isOptimisticMessage(message);

    if (shouldReplace) {
      byId.delete(existingByClientMessageId.id);
      byClientMessageId.set(clientMessageId, message);
      byId.set(message.id, message);
    }
  }

  return sortMessages(Array.from(byId.values()));
}

function upsertMessages(prev: Message[], incoming: Message[]) {
  return dedupeMessages([...prev, ...incoming]);
}

export function useRealtimeMessages(roomId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/rooms/${roomId}/messages`);
      if (res.ok) {
        const data = (await res.json()) as Message[];
        setMessages((prev) => upsertMessages(prev, data));
      }
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    const supabase = getSupabaseClient();

    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => upsertMessages(prev, [newMessage]));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  const addOptimisticMessage = useCallback(
    (msg: Omit<Message, "id" | "created_at">) => {
      const optimistic: Message = {
        ...msg,
        id: `optimistic-${Date.now()}`,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => upsertMessages(prev, [optimistic]));
    },
    []
  );

  return { messages, loading, addOptimisticMessage };
}
