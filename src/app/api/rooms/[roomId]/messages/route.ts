import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("room_id", roomId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  const { senderRole, senderName, content, sessionId, clientMessageId } = await request.json();
  const normalizedClientMessageId =
    typeof clientMessageId === "string" ? clientMessageId.trim() : "";

  if (!content?.trim()) {
    return NextResponse.json(
      { error: "메시지 내용을 입력해 주세요" },
      { status: 400 }
    );
  }

  if (!normalizedClientMessageId) {
    return NextResponse.json(
      { error: "clientMessageId가 필요합니다" },
      { status: 400 }
    );
  }

  if (!UUID_V4_PATTERN.test(normalizedClientMessageId)) {
    return NextResponse.json(
      { error: "clientMessageId 형식이 올바르지 않습니다" },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  // Verify the sender is a participant or admin
  if (senderRole !== "admin") {
    const { data: participant } = await supabase
      .from("participants")
      .select("id")
      .eq("room_id", roomId)
      .eq("session_id", sessionId)
      .single();

    if (!participant) {
      return NextResponse.json({ error: "참여자가 아닙니다" }, { status: 403 });
    }
  }

  // Check room is active
  const { data: room } = await supabase
    .from("rooms")
    .select("status")
    .eq("id", roomId)
    .single();

  if (!room || room.status === "closed") {
    return NextResponse.json({ error: "종료된 상담방입니다" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({
      room_id: roomId,
      sender_role: senderRole,
      sender_name: senderName,
      client_message_id: normalizedClientMessageId,
      content: content.trim(),
    })
    .select()
    .single();

  if (error) {
    // Idempotency key collision: return the already inserted message.
    if (error.code === "23505") {
      const { data: existingMessage, error: existingMessageError } = await supabase
        .from("messages")
        .select("*")
        .eq("room_id", roomId)
        .eq("client_message_id", normalizedClientMessageId)
        .maybeSingle();

      if (!existingMessageError && existingMessage) {
        return NextResponse.json(existingMessage, { status: 200 });
      }
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
