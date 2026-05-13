import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/solomon";

export async function DELETE() {
  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "서버 설정 오류" }, { status: 500 });
  }

  const admin = createClient<Database>(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  // users 테이블 레코드 삭제 (posts/votes/reports는 CASCADE)
  const { error: deleteUserError } = await admin
    .from("users")
    .delete()
    .eq("id", user.id);

  if (deleteUserError) {
    return NextResponse.json({ error: "계정 삭제 실패" }, { status: 500 });
  }

  // auth.users 삭제
  const { error: deleteAuthError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteAuthError) {
    return NextResponse.json({ error: "인증 계정 삭제 실패" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
