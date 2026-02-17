"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function MessageComposer({
  roomId,
  senderRole,
  senderName,
  sessionId,
  disabled,
  onSend,
}: {
  roomId: string;
  senderRole: string;
  senderName: string;
  sessionId: string | null;
  disabled?: boolean;
  onSend?: (msg: {
    room_id: string;
    sender_role: string;
    sender_name: string;
    content: string;
    client_message_id: string;
  }) => void;
}) {
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const sendLockRef = useRef(false);

  function createClientMessageId() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }

    const bytes = new Uint8Array(16);
    if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
      crypto.getRandomValues(bytes);
    } else {
      for (let i = 0; i < bytes.length; i++) {
        bytes[i] = Math.floor(Math.random() * 256);
      }
    }

    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || sending || sendLockRef.current) return;

    const trimmed = content.trim();
    const clientMessageId = createClientMessageId();
    setContent("");
    sendLockRef.current = true;

    // 낙관적 업데이트: 즉시 화면에 반영
    onSend?.({
      room_id: roomId,
      sender_role: senderRole,
      sender_name: senderName,
      content: trimmed,
      client_message_id: clientMessageId,
    });

    setSending(true);
    try {
      const res = await fetch(`/api/rooms/${roomId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderRole,
          senderName,
          content: trimmed,
          sessionId,
          clientMessageId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "메시지 전송에 실패했습니다");
      }
    } catch {
      toast.error("메시지 전송에 실패했습니다");
    } finally {
      sendLockRef.current = false;
      setSending(false);
    }
  }

  return (
    <div className="border-t border-border/60">
      <form
        onSubmit={handleSend}
        className="mx-auto flex w-full max-w-[760px] items-center gap-3 px-6 py-5 md:px-7"
      >
        <Input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={disabled ? "종료된 상담방입니다" : "메시지를 입력하세요..."}
          disabled={disabled || sending}
          className="h-11 flex-1 rounded-none border-0 border-b border-border/70 bg-transparent px-0 text-base leading-[1.65] focus-visible:border-primary focus-visible:ring-0"
          autoComplete="off"
        />
        <Button
          type="submit"
          variant="ghost"
          disabled={disabled || sending || !content.trim()}
          className="h-10 px-3 text-primary hover:text-primary"
        >
          전송
        </Button>
      </form>
    </div>
  );
}
