export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

if (process.env.NODE_ENV === "production") {
  // runtime guard only — tree-shake friendly
}

const TEST_PASSWORD = "solomon2024!";

const TEST_USERS = [
  { email: "test1@solomon.dev", nickname: "김민준", description: "현명한 판단자 (솔로몬 고수)" },
  { email: "test2@solomon.dev", nickname: "이서연", description: "고민하는 시민 (평범한 유저)" },
  { email: "test3@solomon.dev", nickname: "박지호", description: "마이웨이 힙스터 (소수파)" },
  { email: "test4@solomon.dev", nickname: "최유나", description: "새내기 시민 (신규 가입)" },
] as const;

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "프로덕션에서는 사용할 수 없습니다." }, { status: 403 });
  }

  const admin = createAdminClient();
  const result: { email: string; nickname: string; id: string; created: boolean }[] = [];

  // 기존 유저 목록 조회 (이메일 기준 중복 방지)
  const { data: existingData } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const existingMap = new Map(existingData?.users?.map((u) => [u.email, u.id]) ?? []);

  for (const u of TEST_USERS) {
    const existingId = existingMap.get(u.email);

    if (existingId) {
      // 이미 존재 — profile만 upsert
      await admin.from("users").upsert(
        { id: existingId, nickname: u.nickname },
        { onConflict: "id", ignoreDuplicates: false },
      );
      result.push({ email: u.email, nickname: u.nickname, id: existingId, created: false });
    } else {
      // 신규 생성 — email_confirm: true 로 인증 메일 없이 바로 사용 가능
      const { data: created, error } = await admin.auth.admin.createUser({
        email: u.email,
        password: TEST_PASSWORD,
        email_confirm: true,
        user_metadata: { nickname: u.nickname },
      });

      if (error || !created?.user) {
        console.error(`[test/setup-users] ${u.email} 생성 실패:`, error?.message);
        continue;
      }

      // trigger가 users 테이블 row를 자동 생성하지만 nickname이 틀릴 수 있으므로 upsert
      await admin.from("users").upsert(
        { id: created.user.id, nickname: u.nickname },
        { onConflict: "id", ignoreDuplicates: false },
      );
      result.push({ email: u.email, nickname: u.nickname, id: created.user.id, created: true });
    }
  }

  return NextResponse.json({ ok: true, users: result });
}
