"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export function EntryMessageSettings() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    async function fetchMessage() {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/entry-message");
        if (!res.ok) {
          toast.error("입장문 설정을 불러오지 못했습니다");
          return;
        }

        const data = await res.json();
        if (!cancelled) {
          setMessage(data.message ?? "");
        }
      } catch {
        toast.error("입장문 설정을 불러오지 못했습니다");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchMessage();
    return () => {
      cancelled = true;
    };
  }, [open]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/entry-message", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "입장문 저장에 실패했습니다");
        return;
      }

      toast.success("입장문이 저장되었습니다");
    } catch {
      toast.error("입장문 저장에 실패했습니다");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">입장문 설정</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>입장문 설정</DialogTitle>
          <DialogDescription>
            새 상담방이 처음 시작될 때 1회 표시되는 안내 문구입니다.
          </DialogDescription>
        </DialogHeader>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="예: 상담 일정 조율을 위한 방입니다. 개인정보는 작성하지 말아 주세요."
          className="min-h-36 w-full resize-y rounded-md border border-border bg-transparent px-3 py-2 text-[0.98rem] leading-relaxed outline-none placeholder:text-muted-foreground/70 focus:border-primary"
          maxLength={600}
          disabled={loading || saving}
        />

        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">{message.trim().length}/600</span>
          <Button
            type="button"
            onClick={handleSave}
            disabled={loading || saving}
            className="h-9 px-4"
          >
            {saving ? "저장 중..." : "입장문 저장"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
