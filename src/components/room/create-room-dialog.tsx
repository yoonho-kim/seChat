"use client";

import { useState } from "react";
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

export function CreateRoomDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    setLoading(true);
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "상담방 생성에 실패했습니다");
        return;
      }

      const room = await res.json();
      toast.success(`상담방이 생성되었습니다. 코드: ${room.code}`);
      setOpen(false);
      onCreated();
    } catch {
      toast.error("네트워크 오류");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>상담방 만들기</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>새 상담방 만들기</DialogTitle>
          <DialogDescription>
            상담사와 내담자가 입장할 수 있는 4자리 코드가 생성됩니다.
          </DialogDescription>
        </DialogHeader>
        <Button onClick={handleCreate} disabled={loading} className="w-full">
          {loading ? "생성 중..." : "상담방 만들기"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
