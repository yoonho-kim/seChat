import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";

const ENTRY_MESSAGE_KEY = "room_entry_message";
const LEGACY_SETTING_NAME = "__entry_message_setting__";

async function getEntryMessageValue() {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", ENTRY_MESSAGE_KEY)
    .maybeSingle();

  if (!error) {
    return data?.value ?? "";
  }

  if (error.code !== "42P01") {
    throw error;
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
    throw legacyError;
  }

  return legacy?.content ?? "";
}

async function setEntryMessageValue(message: string) {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("app_settings")
    .upsert(
      {
        key: ENTRY_MESSAGE_KEY,
        value: message,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" }
    );

  if (!error) {
    return;
  }

  if (error.code !== "42P01") {
    throw error;
  }

  // Fallback for old schema (without app_settings table)
  const { data: legacy, error: legacySelectError } = await supabase
    .from("messages")
    .select("id")
    .is("room_id", null)
    .eq("sender_role", "system")
    .eq("sender_name", LEGACY_SETTING_NAME)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (legacySelectError) {
    throw legacySelectError;
  }

  if (legacy?.id) {
    const { error: updateError } = await supabase
      .from("messages")
      .update({ content: message })
      .eq("id", legacy.id);

    if (updateError) {
      throw updateError;
    }
    return;
  }

  const { error: insertError } = await supabase.from("messages").insert({
    room_id: null,
    sender_role: "system",
    sender_name: LEGACY_SETTING_NAME,
    content: message,
  });

  if (insertError) {
    throw insertError;
  }
}

export async function GET(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  try {
    const message = await getEntryMessageValue();
    return NextResponse.json({ message });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "입장문 설정을 불러오지 못했습니다";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  const { message } = await request.json();
  const normalized = typeof message === "string" ? message.trim() : "";

  if (normalized.length > 600) {
    return NextResponse.json(
      { error: "입장문은 600자 이하로 입력해 주세요" },
      { status: 400 }
    );
  }

  try {
    await setEntryMessageValue(normalized);
    return NextResponse.json({ message: normalized });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "입장문 저장에 실패했습니다";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
