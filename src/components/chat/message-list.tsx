"use client";

import { useEffect, useRef } from "react";
import { MessageBubble } from "./message-bubble";
import type { Message } from "@/hooks/use-realtime-messages";

export function MessageList({
  messages,
  currentRole,
  loading,
}: {
  messages: Message[];
  currentRole: string | null;
  loading: boolean;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (loading) {
    return (
      <div className="flex-1 min-h-0 flex items-center justify-center">
        <p className="text-muted-foreground">메시지 불러오는 중...</p>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 min-h-0 flex items-center justify-center">
        <p className="text-muted-foreground">
          아직 메시지가 없습니다. 대화를 시작해 보세요!
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain bg-background">
      <div className="mx-auto flex w-full max-w-[760px] flex-col gap-4 px-6 py-8 md:px-7">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isOwn={message.sender_role === currentRole}
          />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
