"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "@/hooks/use-session";
import { useRealtimeMessages } from "@/hooks/use-realtime-messages";
import { MessageList } from "@/components/chat/message-list";
import { MessageComposer } from "@/components/chat/message-composer";
import { NoticeBanner } from "@/components/chat/notice-banner";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

interface RoomInfo {
  id: string;
  code: string;
  status: string;
  participants: { role: string; display_name: string }[];
}

function roleLabel(role: string) {
  switch (role) {
    case "counselor": return "상담사";
    case "client": return "내담자";
    case "admin": return "관리자";
    default: return role;
  }
}

function statusLabel(status: string) {
  return status === "active" ? "진행 중" : "종료됨";
}

export default function ChatPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAdmin = searchParams.get("admin") === "true";
  const session = useSession();
  const { messages, loading, addOptimisticMessage } = useRealtimeMessages(roomId);
  const [room, setRoom] = useState<RoomInfo | null>(null);
  const [roomLoading, setRoomLoading] = useState(true);

  useEffect(() => {
    async function fetchRoom() {
      try {
        // Fetch room info via admin API (requires admin cookie)
        // or we fetch it from the messages endpoint context
        const res = await fetch(`/api/rooms/${roomId}/info`);
        if (res.ok) {
          const data = await res.json();
          setRoom(data);
        }
      } finally {
        setRoomLoading(false);
      }
    }
    fetchRoom();

    // Poll room status every 10 seconds to detect closure
    const interval = setInterval(fetchRoom, 10000);
    return () => clearInterval(interval);
  }, [roomId]);

  const currentRole = isAdmin ? "admin" : session.role;
  const currentName = isAdmin ? "관리자" : session.displayName;
  const isClosed = room?.status === "closed";

  async function handleLeave() {
    // 관리자는 입/퇴장 시스템 메시지를 남기지 않음
    if (currentRole !== "admin") {
      await fetch(`/api/rooms/${roomId}/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderRole: currentRole,
          senderName: currentName,
        }),
      }).catch(() => {});
    }

    // 세션 쿠키 삭제
    document.cookie = "session_id=; path=/; max-age=0";
    document.cookie = "session_role=; path=/; max-age=0";
    document.cookie = "session_name=; path=/; max-age=0";
    router.push(isAdmin ? "/admin/dashboard" : "/");
  }

  if (roomLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">상담방 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b border-border/60">
        <div className="mx-auto flex w-full max-w-[760px] items-end justify-between gap-4 px-6 py-5 md:px-7">
          <div className="space-y-1">
            {isAdmin ? (
              <Link
                href="/admin/dashboard"
                className="m-0 inline-block text-[1.35rem] font-semibold tracking-tight text-foreground transition-colors hover:text-primary"
              >
                SeChat
              </Link>
            ) : (
              <h1 className="m-0 text-[1.35rem] font-semibold tracking-tight text-foreground">
                SeChat
              </h1>
            )}
            {room && (
              <p className="m-0 text-sm text-muted-foreground">
                상담방 {room.code} · {statusLabel(room.status)}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-sm leading-relaxed">
            {room?.participants.map((p) => (
              <span key={p.role} className="text-muted-foreground">
                {roleLabel(p.role)}: <span className="text-foreground">{p.display_name}</span>
              </span>
            ))}
            {currentRole && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="ml-1 cursor-pointer text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline">
                    나: {roleLabel(currentRole)}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    {currentName}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={handleLeave}
                    className="cursor-pointer"
                  >
                    나가기
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </header>

      {/* Notice Banner */}
      <NoticeBanner status={room?.status || "active"} />

      {/* Messages */}
      <MessageList
        messages={messages}
        currentRole={currentRole}
        loading={loading}
      />

      {/* Composer */}
      {currentRole && (
        <MessageComposer
          roomId={roomId}
          senderRole={currentRole}
          senderName={currentName || "익명"}
          sessionId={session.sessionId}
          disabled={isClosed}
          onSend={addOptimisticMessage}
        />
      )}
    </div>
  );
}
