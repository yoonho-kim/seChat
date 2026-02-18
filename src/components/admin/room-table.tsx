"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Participant {
  id: string;
  role: string;
  display_name: string;
}

interface Room {
  id: string;
  code: string;
  admin_label: string | null;
  status: string;
  created_at: string;
  closed_at: string | null;
  participants: Participant[];
}

function roleLabel(role: string) {
  switch (role) {
    case "counselor": return "상담사";
    case "client": return "내담자";
    case "admin": return "관리자";
    default: return role;
  }
}

export function RoomTable({
  rooms,
  onRefresh,
}: {
  rooms: Room[];
  onRefresh: () => void;
}) {
  const router = useRouter();
  const [closingId, setClosingId] = useState<string | null>(null);

  async function handleClose(roomId: string) {
    setClosingId(roomId);
    try {
      const res = await fetch(`/api/rooms/${roomId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "closed" }),
      });

      if (!res.ok) {
        toast.error("상담방 종료에 실패했습니다");
        return;
      }

      toast.success("상담방이 종료되었습니다");
      onRefresh();
    } catch {
      toast.error("네트워크 오류");
    } finally {
      setClosingId(null);
    }
  }

  if (rooms.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-8">
        아직 상담방이 없습니다. 새로 만들어 보세요.
      </p>
    );
  }

  return (
    <div className="divide-y divide-border/60 border-y border-border/60">
      {rooms.map((room) => (
        <article key={room.id} className="space-y-3 px-1 py-6 md:px-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="m-0 text-sm font-medium text-foreground">
                {room.admin_label || "미지정 상담"}
              </p>
              <p className="m-0 text-2xl font-mono tracking-[0.08em]">
                {room.code}
              </p>
              <p
                className={`m-0 text-sm ${
                  room.status === "active"
                    ? "text-emerald-700"
                    : "text-muted-foreground"
                }`}
              >
                {room.status === "active" ? "진행 중" : "종료됨"}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                className="px-2.5"
                onClick={() => router.push(`/chat/${room.id}?admin=true`)}
              >
                채팅 보기
              </Button>
              {room.status === "active" && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="px-2.5 text-destructive hover:text-destructive"
                  onClick={() => handleClose(room.id)}
                  disabled={closingId === room.id}
                >
                  {closingId === room.id ? "종료 중..." : "상담방 종료"}
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
            <span>생성: {new Date(room.created_at).toLocaleString("ko-KR")}</span>
            {room.closed_at && (
              <span>종료: {new Date(room.closed_at).toLocaleString("ko-KR")}</span>
            )}
          </div>

          {room.participants.length > 0 ? (
            <p className="m-0 text-sm text-foreground/80">
              {room.participants
                .map((participant) => `${roleLabel(participant.role)}: ${participant.display_name || "익명"}`)
                .join(" · ")}
            </p>
          ) : (
            <p className="m-0 text-sm text-muted-foreground">
              아직 참여자가 없습니다.
            </p>
          )}
        </article>
      ))}
    </div>
  );
}
