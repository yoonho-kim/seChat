import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("rooms")
    .select("id, code, status, participants(role, display_name)")
    .eq("id", roomId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "상담방을 찾을 수 없습니다" }, { status: 404 });
  }

  return NextResponse.json(data);
}
