"use client";

import { useEffect, useState, useCallback } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";

export interface Message {
  id: string;
  room_id: string;
  sender_role: string;
  sender_name: string;
  content: string;
  created_at: string;
}

export function useRealtimeMessages(roomId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/rooms/${roomId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
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
          setMessages((prev) => {
            // Replace optimistic message or avoid duplicates
            if (prev.some((m) => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
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
      setMessages((prev) => [...prev, optimistic]);
    },
    []
  );

  return { messages, loading, addOptimisticMessage };
}
