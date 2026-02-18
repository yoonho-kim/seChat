"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export function CreateRoomDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [adminLabel, setAdminLabel] = useState("");

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      setAdminLabel("");
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const normalizedLabel = adminLabel.trim();
    if (!normalizedLabel) {
      toast.error("상담 명칭을 입력해 주세요");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminLabel: normalizedLabel }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "상담방 생성에 실패했습니다");
        return;
      }

      const room = await res.json();
      toast.success(`상담방이 생성되었습니다. 코드: ${room.code}`);
      handleOpenChange(false);
      onCreated();
    } catch {
      toast.error("네트워크 오류");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>상담방 만들기</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>새 상담방 만들기</DialogTitle>
          <DialogDescription>
            먼저 관리자용 상담 명칭을 설정하면, 생성 시 4자리 코드가 발급됩니다.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreate} className="space-y-3">
          <Input
            value={adminLabel}
            onChange={(e) => setAdminLabel(e.target.value)}
            placeholder="예: 김OO 상담 1차 / 2월 일정 조율"
            maxLength={120}
            disabled={loading}
            autoFocus
          />
          <p className="m-0 text-xs text-muted-foreground">
            관리자 화면 목록에서만 보이는 분류용 명칭입니다. ({adminLabel.trim().length}/120)
          </p>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "생성 중..." : "상담방 만들기"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
