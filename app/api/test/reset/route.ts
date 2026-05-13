export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const SEED_TAG = "[solomon-test]";

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "프로덕션에서는 사용할 수 없습니다." }, { status: 403 });
  }

  const userSupabase = await createClient();
  const { data: { user }, error: authErr } = await userSupabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("posts")
    .delete()
    .eq("user_id", user.id)
    .like("content", `${SEED_TAG}%`);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
