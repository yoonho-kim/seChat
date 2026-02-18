import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";

const ENTRY_MESSAGE_KEY = "room_entry_message";
const LEGACY_SETTING_NAME = "__entry_message_setting__";

function generateCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

async function getEntryMessage(supabase: ReturnType<typeof createServiceClient>) {
  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", ENTRY_MESSAGE_KEY)
    .maybeSingle();

  if (!error) {
    return data?.value?.trim() ?? "";
  }

  if (error.code !== "42P01") {
    return "";
  }

  // Fallback for old schema (without app_settings table)
  const { data: legacy, error: legacyError } = await supabase
    .from("messages")
    .select("content")
    .is("room_id", null)
    .eq("sender_role", "system")
    .eq("sender_name", LEGACY_SETTING_NAME)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (legacyError) {
    return "";
  }

  return legacy?.content?.trim() ?? "";
}

export async function GET(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("rooms")
    .select("*, participants(*)")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  let payload: unknown = {};
  try {
    payload = await request.json();
  } catch {
    payload = {};
  }

  const adminLabelValue =
    typeof payload === "object" &&
    payload !== null &&
    "adminLabel" in payload &&
    typeof payload.adminLabel === "string"
      ? payload.adminLabel.trim()
      : "";

  if (!adminLabelValue) {
    return NextResponse.json(
      { error: "상담 명칭을 입력해 주세요" },
      { status: 400 }
    );
  }

  if (adminLabelValue.length > 120) {
    return NextResponse.json(
      { error: "상담 명칭은 120자 이하로 입력해 주세요" },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  // Generate unique 4-digit code with retry
  let code: string;
  let attempts = 0;
  while (true) {
    code = generateCode();
    const { data: existing } = await supabase
      .from("rooms")
      .select("id")
      .eq("code", code)
      .eq("status", "active")
      .single();

    if (!existing) break;
    attempts++;
    if (attempts > 10) {
      return NextResponse.json(
        { error: "고유 코드를 생성하지 못했습니다" },
        { status: 500 }
      );
    }
  }

  const { data, error } = await supabase
    .from("rooms")
    .insert({
      code,
      admin_label: adminLabelValue,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 채팅방 시작 시 1회 노출되는 입장문을 시스템 메시지로 저장
  const entryMessage = await getEntryMessage(supabase);
  if (entryMessage) {
    await supabase.from("messages").insert({
      room_id: data.id,
      sender_role: "system",
      sender_name: "시스템",
      content: entryMessage,
    });
  }

  return NextResponse.json(data, { status: 201 });
}
