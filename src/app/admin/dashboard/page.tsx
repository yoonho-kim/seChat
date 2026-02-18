"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { RoomTable } from "@/components/admin/room-table";
import { EntryMessageSettings } from "@/components/admin/entry-message-settings";
import { CreateRoomDialog } from "@/components/room/create-room-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRooms = useCallback(async () => {
    try {
      const res = await fetch("/api/rooms");
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      if (!res.ok) {
        toast.error("상담방 목록을 불러오지 못했습니다");
        return;
      }
      const data = await res.json();
      setRooms(data);
    } catch {
      toast.error("네트워크 오류");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  return (
    <div className="min-h-screen">
      <header className="border-b border-border/60">
        <div className="mx-auto flex w-full max-w-[920px] items-end justify-between gap-4 px-6 py-8 md:px-7">
          <div>
            <h1 className="m-0 text-[1.75rem] font-semibold tracking-tight text-foreground">
              SeChat 관리자
            </h1>
            <p className="m-0 mt-1 text-sm text-muted-foreground">
              상담방 현황과 참여자를 차분하게 관리할 수 있습니다.
            </p>
          </div>
          <div className="flex shrink-0 gap-1.5">
            <CreateRoomDialog onCreated={fetchRooms} />
            <EntryMessageSettings />
            <Button
              variant="ghost"
              onClick={() => {
                document.cookie =
                  "admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
                router.push("/admin/login");
              }}
            >
              로그아웃
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[920px] px-6 py-8 md:px-7">
        <div className="space-y-8">
          {loading ? (
            <p className="text-center text-muted-foreground">상담방 불러오는 중...</p>
          ) : (
            <RoomTable rooms={rooms} onRefresh={fetchRooms} />
          )}
        </div>
      </main>
    </div>
  );
}
