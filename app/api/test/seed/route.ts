export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

if (process.env.NODE_ENV === "production") {
  // runtime guard only
}

const SEED_TAG = "[solomon-test]";
const H = 3_600_000;
const M = 60_000;

interface SeedUser {
  email: string;
  nickname: string;
  id: string;
}

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "프로덕션에서는 사용할 수 없습니다." }, { status: 403 });
  }

  const admin = createAdminClient();
  const now = Date.now();

  // ── 테스트 유저 조회 ─────────────────────────────────────────────────────
  const { data: authData } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const testEmails = [
    "test1@solomon.dev",
    "test2@solomon.dev",
    "test3@solomon.dev",
    "test4@solomon.dev",
  ];
  const authUsers = (authData?.users ?? []).filter((u) => testEmails.includes(u.email ?? ""));

  if (authUsers.length < 4) {
    return NextResponse.json(
      { error: "테스트 유저가 없습니다. '유저 생성'을 먼저 실행해주세요." },
      { status: 400 },
    );
  }

  // email → { id, nickname } 매핑
  const { data: profiles } = await admin
    .from("users")
    .select("id, nickname")
    .in("id", authUsers.map((u) => u.id));

  const userMap = new Map<string, SeedUser>();
  for (const au of authUsers) {
    const profile = profiles?.find((p) => p.id === au.id);
    userMap.set(au.email!, {
      email: au.email!,
      nickname: profile?.nickname ?? au.email!.split("@")[0],
      id: au.id,
    });
  }

  const u1 = userMap.get("test1@solomon.dev")!; // 김민준
  const u2 = userMap.get("test2@solomon.dev")!; // 이서연
  const u3 = userMap.get("test3@solomon.dev")!; // 박지호
  const u4 = userMap.get("test4@solomon.dev")!; // 최유나

  // ── 기존 시드 데이터 삭제 ─────────────────────────────────────────────────
  await admin
    .from("posts")
    .delete()
    .in("user_id", [u1.id, u2.id, u3.id, u4.id])
    .like("content", `${SEED_TAG}%`);

  // ── 헬퍼 ─────────────────────────────────────────────────────────────────
  async function createPost(params: {
    userId: string;
    content: string;
    imageUrl?: string;
    options: string[];
    createdAgoMs: number;
    expiresInMs: number;
    status?: "active" | "closed";
  }) {
    const createdAt = new Date(now - params.createdAgoMs).toISOString();
    const expiresAt = new Date(now - params.createdAgoMs + params.expiresInMs).toISOString();

    const { data: post } = await admin
      .from("posts")
      .insert({
        user_id: params.userId,
        content: `${SEED_TAG} ${params.content}`,
        image_url: params.imageUrl ?? null,
        created_at: createdAt,
        expires_at: expiresAt,
        status: params.status ?? "active",
      })
      .select("id")
      .single();

    if (!post) return null;

    await admin.from("options").insert(
      params.options.map((text, i) => ({
        post_id: post.id,
        option_text: text,
        option_order: i + 1,
      })),
    );

    return post.id;
  }

  async function addVotesAndClose(
    postId: string,
    optionIds: string[],
    counts: number[],
    userSeed: number,
  ) {
    const votes = [];
    let idx = 0;
    for (let i = 0; i < optionIds.length; i++) {
      for (let j = 0; j < (counts[i] ?? 0); j++) {
        const uid = `${String(userSeed).padStart(8, "0")}-0000-0000-0000-${String(idx++).padStart(12, "0")}`;
        votes.push({ post_id: postId, option_id: optionIds[i], user_id: uid });
      }
    }
    await admin.from("votes").insert(votes);
    // active → closed 트리거 발동 → 솔로몬 지수 갱신
    await admin.from("posts").update({ status: "closed" }).eq("id", postId);
  }

  const seeded: { label: string; postId: string }[] = [];

  // ════════════════════════════════════════════════════════════════════════
  // 진행중 게시글 (6개)
  // ════════════════════════════════════════════════════════════════════════

  // 1. 카톡 비번 — 22h 남음 (일반)
  {
    const id = await createPost({
      userId: u2.id,
      content:
        "남자친구가 카카오톡 비밀번호를 알려달라고 해요. \"신뢰의 표현\"이라는데, 알려줘야 할까요?",
      options: ["알려준다. 신뢰가 중요하다", "알려주지 않는다. 사생활은 필요하다", "서로 공유하는 건 좀 아닌 것 같다"],
      createdAgoMs: 2 * H,
      expiresInMs: 24 * H,
    });
    if (id) seeded.push({ label: "진행중 · 카톡 비번 (22h)", postId: id });
  }

  // 2. 회식 강요 — 23.5h 남음
  {
    const id = await createPost({
      userId: u1.id,
      content:
        "매주 금요일 회식 참여를 '사실상 강요'하는 직장이에요. 안 가면 눈치 주는데, 어떻게 해야 할까요?",
      options: [
        "꾸준히 참석한다. 인간관계도 일의 일부",
        "정중히 거절한다. 사생활이 우선",
        "가끔은 가고 가끔은 빠진다",
      ],
      createdAgoMs: 30 * M,
      expiresInMs: 24 * H,
    });
    if (id) seeded.push({ label: "진행중 · 회식 강요 (23.5h)", postId: id });
  }

  // 3. 친구 전 여친 — 20h 남음 + 이미지
  {
    const id = await createPost({
      userId: u3.id,
      content:
        "친한 친구가 제 전 여자친구랑 사귀기 시작했다고 고백해왔어요. 어떻게 반응해야 할까요?",
      imageUrl:
        "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&q=80",
      options: [
        "축하해준다. 이미 끝난 관계",
        "불편하다고 솔직히 말한다",
        "겉으론 괜찮은 척하되 거리를 둔다",
        "절교를 고려한다",
      ],
      createdAgoMs: 4 * H,
      expiresInMs: 24 * H,
    });
    if (id) seeded.push({ label: "진행중 · 친구 전 여친 (20h) + 이미지", postId: id });
  }

  // 4. 카페 자리맡기 — 23h 남음
  {
    const id = await createPost({
      userId: u4.id,
      content:
        "카페에서 공부하다가 모르는 사람이 '잠깐 짐 좀 봐달라'고 하고 사라졌어요. 얼마나 기다려야 할까요?",
      options: ["그냥 봐준다. 당연한 거 아닌가", "10~15분까지만 기다린다", "애초에 거절한다"],
      createdAgoMs: 1 * H,
      expiresInMs: 24 * H,
    });
    if (id) seeded.push({ label: "진행중 · 카페 자리맡기 (23h)", postId: id });
  }

  // 5. 공무원 권유 — 5h 남음 (준긴급)
  {
    const id = await createPost({
      userId: u2.id,
      content:
        "취업 준비 중인데 부모님이 '그냥 공무원 시험 봐라'고 계속 하세요. 맞는 말일까요?",
      options: [
        "맞다. 안정성이 최고다",
        "아니다. 하고 싶은 일을 해야 한다",
        "상황에 따라 다르다",
      ],
      createdAgoMs: 19 * H,
      expiresInMs: 24 * H,
    });
    if (id) seeded.push({ label: "진행중 · 공무원 권유 (5h)", postId: id });
  }

  // 6. 첫 월급 — 1.5h 남음 (긴급 🔴)
  {
    const id = await createPost({
      userId: u1.id,
      content:
        "첫 월급 받았어요! 부모님께 선물을 드려야 할까요, 아니면 미래를 위해 저축해야 할까요?",
      options: ["부모님 선물이 우선이다", "일단 저축이 먼저다", "반반 나눈다"],
      createdAgoMs: 22.5 * H,
      expiresInMs: 24 * H,
    });
    if (id) seeded.push({ label: "진행중 · 첫 월급 (1.5h 긴급🔴)", postId: id });
  }

  // ════════════════════════════════════════════════════════════════════════
  // 종료된 게시글 (6개)
  // ════════════════════════════════════════════════════════════════════════

  // 7. 퇴사 카톡 인사 — 2h 전 종료
  {
    const id = await createPost({
      userId: u3.id,
      content: "퇴사하면서 팀 동료들한테 개인 카카오톡으로 따로 인사 문자 보내야 할까요?",
      options: ["보낸다. 예의상 해야 한다", "안 보낸다. 어차피 볼 일 없다"],
      createdAgoMs: 26 * H,
      expiresInMs: 24 * H,
    });
    if (id) {
      const { data: opts } = await admin
        .from("options")
        .select("id")
        .eq("post_id", id)
        .order("option_order");
      if (opts?.length === 2) {
        await addVotesAndClose(id, [opts[0].id, opts[1].id], [73, 27], 1);
      }
      seeded.push({ label: "종료 · 퇴사 카톡 인사 (73:27)", postId: id });
    }
  }

  // 8. 첫 데이트 계산 — 6h 전 종료
  {
    const id = await createPost({
      userId: u4.id,
      content: "첫 데이트 계산은 어떻게 하는 게 맞을까요?",
      options: ["남자가 낸다", "더치페이가 맞다", "번갈아 내는 게 좋다"],
      createdAgoMs: 30 * H,
      expiresInMs: 24 * H,
    });
    if (id) {
      const { data: opts } = await admin
        .from("options")
        .select("id")
        .eq("post_id", id)
        .order("option_order");
      if (opts?.length === 3) {
        await addVotesAndClose(id, [opts[0].id, opts[1].id, opts[2].id], [61, 24, 15], 2);
      }
      seeded.push({ label: "종료 · 첫 데이트 계산 (61:24:15)", postId: id });
    }
  }

  // 9. 부모님 환갑 선물 — 12h 전 종료
  {
    const id = await createPost({
      userId: u2.id,
      content:
        "부모님 환갑 선물, 뭐가 더 나을까요? 현금이 실용적이지만 여행은 추억이 될 것 같아서요.",
      options: ["현금 or 상품권", "여행 패키지", "명품 선물"],
      createdAgoMs: 36 * H,
      expiresInMs: 24 * H,
    });
    if (id) {
      const { data: opts } = await admin
        .from("options")
        .select("id")
        .eq("post_id", id)
        .order("option_order");
      if (opts?.length === 3) {
        await addVotesAndClose(id, [opts[0].id, opts[1].id, opts[2].id], [54, 38, 8], 3);
      }
      seeded.push({ label: "종료 · 환갑 선물 (54:38:8)", postId: id });
    }
  }

  // 10. 편의점 잔돈 초과 — 1일 전 종료
  {
    const id = await createPost({
      userId: u1.id,
      content:
        "편의점 알바 중 손님이 계산 실수로 만원을 더 줬어요. 손님은 이미 가버렸습니다. 어떻게 해야 할까요?",
      options: [
        "어떻게든 손님에게 돌려준다",
        "가게 주인에게 말하고 보관한다",
        "그냥 내 돈으로 한다",
      ],
      createdAgoMs: 48 * H,
      expiresInMs: 24 * H,
    });
    if (id) {
      const { data: opts } = await admin
        .from("options")
        .select("id")
        .eq("post_id", id)
        .order("option_order");
      if (opts?.length === 3) {
        await addVotesAndClose(id, [opts[0].id, opts[1].id, opts[2].id], [88, 8, 4], 4);
      }
      seeded.push({ label: "종료 · 편의점 잔돈 (88:8:4)", postId: id });
    }
  }

  // 11. 수면이 취미? — 1.5일 전 종료 (동점에 가까운 케이스)
  {
    const id = await createPost({
      userId: u3.id,
      content: "주말에 종일 자는 것도 취미라고 할 수 있을까요?",
      options: ["당연히 취미지!", "취미라기엔 좀..."],
      createdAgoMs: 60 * H,
      expiresInMs: 24 * H,
    });
    if (id) {
      const { data: opts } = await admin
        .from("options")
        .select("id")
        .eq("post_id", id)
        .order("option_order");
      if (opts?.length === 2) {
        await addVotesAndClose(id, [opts[0].id, opts[1].id], [68, 32], 5);
      }
      seeded.push({ label: "종료 · 수면이 취미 (68:32)", postId: id });
    }
  }

  // 12. 민트초코 — 2일 전 종료 (동점 테스트)
  {
    const id = await createPost({
      userId: u4.id,
      content: "민트초코 아이스크림, 여러분의 최종 판결은?",
      options: ["민초는 신의 선물 🍫", "치약 맛 절대 반대 ❌"],
      createdAgoMs: 72 * H,
      expiresInMs: 24 * H,
    });
    if (id) {
      const { data: opts } = await admin
        .from("options")
        .select("id")
        .eq("post_id", id)
        .order("option_order");
      if (opts?.length === 2) {
        // 동점 (50:50) — option_order 낮은 쪽이 솔로몬의 선택
        await addVotesAndClose(id, [opts[0].id, opts[1].id], [50, 50], 6);
      }
      seeded.push({ label: "종료 · 민트초코 동점 (50:50)", postId: id });
    }
  }

  return NextResponse.json({ ok: true, seeded });
}
