import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  const { senderRole, senderName } = await request.json();

  if (!senderRole || !senderName) {
    return NextResponse.json({ error: "잘못된 요청입니다" }, { status: 400 });
  }

  if (senderRole === "admin") {
    return NextResponse.json({ ok: true });
  }

  const roleLabel =
    senderRole === "counselor" ? "상담사" : senderRole === "client" ? "내담자" : senderRole;

  const supabase = createServiceClient();

  await supabase.from("messages").insert({
    room_id: roomId,
    sender_role: "system",
    sender_name: "시스템",
    content: `${senderName}(${roleLabel})님이 나갔습니다.`,
  });

  return NextResponse.json({ ok: true });
}
