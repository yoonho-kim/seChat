import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { code, role, displayName } = await request.json();

    if (!code || !role || !displayName?.trim()) {
      return NextResponse.json(
        { error: "상담방 코드, 역할, 표시 이름을 모두 입력해 주세요" },
        { status: 400 }
      );
    }

    if (!["counselor", "client"].includes(role)) {
      return NextResponse.json({ error: "올바르지 않은 역할입니다" }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Find active room by code
    const { data: room } = await supabase
      .from("rooms")
      .select("id, status")
      .eq("code", code)
      .eq("status", "active")
      .single();

    if (!room) {
      return NextResponse.json(
        { error: "상담방을 찾을 수 없거나 이미 종료되었습니다" },
        { status: 404 }
      );
    }

    // Attempt to insert participant — unique constraint prevents duplicate roles
    const { data: participant, error } = await supabase
      .from("participants")
      .insert({
        room_id: room.id,
        role,
        display_name: displayName.trim(),
      })
      .select("session_id")
      .single();

    if (error) {
      if (error.code === "23505") {
        // unique_violation — check if same display_name for re-entry
        const { data: existing } = await supabase
          .from("participants")
          .select("session_id, display_name")
          .eq("room_id", room.id)
          .eq("role", role)
          .single();

        if (existing && existing.display_name === displayName.trim()) {
          // 같은 이름이면 재입장 허용 — 입장 시스템 메시지
          const roleLabel = role === "counselor" ? "상담사" : "내담자";
          await supabase.from("messages").insert({
            room_id: room.id,
            sender_role: "system",
            sender_name: "시스템",
            content: `${displayName.trim()}(${roleLabel})님이 입장했습니다.`,
          });

          const response = NextResponse.json({
            roomId: room.id,
            sessionId: existing.session_id,
          });

          response.cookies.set("session_id", existing.session_id, {
            httpOnly: false,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24,
            path: "/",
          });

          response.cookies.set("session_role", role, {
            httpOnly: false,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24,
            path: "/",
          });

          response.cookies.set("session_name", displayName.trim(), {
            httpOnly: false,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24,
            path: "/",
          });

          return response;
        }

        return NextResponse.json(
          { error: `이미 ${role === "counselor" ? "상담사" : "내담자"}가 이 상담방에 참여하고 있습니다` },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 신규 입장 시스템 메시지
    const roleLabel = role === "counselor" ? "상담사" : "내담자";
    await supabase.from("messages").insert({
      room_id: room.id,
      sender_role: "system",
      sender_name: "시스템",
      content: `${displayName.trim()}(${roleLabel})님이 입장했습니다.`,
    });

    const response = NextResponse.json({
      roomId: room.id,
      sessionId: participant.session_id,
    });

    // Set session cookie
    response.cookies.set("session_id", participant.session_id, {
      httpOnly: false, // needs to be readable by client for realtime auth
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });

    response.cookies.set("session_role", role, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    response.cookies.set("session_name", displayName.trim(), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "잘못된 요청입니다" },
      { status: 400 }
    );
  }
}
