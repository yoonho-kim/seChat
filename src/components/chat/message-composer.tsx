"use client";

import { useState } from "react";
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
  onSend?: (msg: { room_id: string; sender_role: string; sender_name: string; content: string }) => void;
}) {
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || sending) return;

    const trimmed = content.trim();
    setContent("");

    // 낙관적 업데이트: 즉시 화면에 반영
    onSend?.({
      room_id: roomId,
      sender_role: senderRole,
      sender_name: senderName,
      content: trimmed,
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
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "메시지 전송에 실패했습니다");
      }
    } catch {
      toast.error("메시지 전송에 실패했습니다");
    } finally {
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
