import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  const { roomId } = await params;
  const body = await request.json();
  const supabase = createServiceClient();

  if (body.status === "closed") {
    const { data, error } = await supabase
      .from("rooms")
      .update({ status: "closed", closed_at: new Date().toISOString() })
      .eq("id", roomId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  }

  return NextResponse.json({ error: "잘못된 요청입니다" }, { status: 400 });
}
