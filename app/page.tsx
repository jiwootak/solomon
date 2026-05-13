/**
 * 홈 피드 (Server Component)
 * - "진행중" / "종료됨" 두 리스트를 한 번에 fetch.
 * - Supabase 미설정 시 DEMO_POSTS 로 fallback (UI 확인용).
 *
 * ★ 블라인드 룰: 진행중 게시글에는 vote_count 를 절대 포함시키지 않는다.
 *    options 는 id / option_text / option_order 만 select.
 */
import FeedView from "@/components/feed/FeedView";
import type { PostWithOptions } from "@/types/solomon";
import { createAdminClient } from "@/lib/supabase/admin";

// 캐싱 비활성화 — 피드는 항상 최신 상태 (24h 만료 즉시 반영)
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  const { activePosts, closedPosts, isDemo } = await loadFeed();

  return <FeedView activePosts={activePosts} closedPosts={closedPosts} isDemo={isDemo} />;
}

/* -------------------------------------------------------------------------- */
/* Data loading                                                                */
/* -------------------------------------------------------------------------- */

async function loadFeed(): Promise<{
  activePosts: PostWithOptions[];
  closedPosts: PostWithOptions[];
  isDemo: boolean;
}> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return { activePosts: DEMO_ACTIVE, closedPosts: DEMO_CLOSED, isDemo: true };
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    /**
     * 진행중 — 블라인드 룰: vote_count 미포함.
     * status='active' AND expires_at > now() 만 조회.
     */
    const nowIso = new Date().toISOString();
    const activeReq = supabase
      .from("posts")
      .select(
        `
          id, user_id, content, image_url, created_at, expires_at, status,
          author:users!posts_user_id_fkey ( id, nickname, avatar_url ),
          options ( id, post_id, option_text, option_order, created_at )
        `,
      )
      .eq("status", "active")
      .gt("expires_at", nowIso)
      .order("created_at", { ascending: false })
      .limit(50);

    /** 종료됨 — closed 인 게시글만 (vote_count 는 결과 페이지에서 RPC 로 별도 조회) */
    const closedReq = supabase
      .from("posts")
      .select(
        `
          id, user_id, content, image_url, created_at, expires_at, status,
          author:users!posts_user_id_fkey ( id, nickname, avatar_url ),
          options ( id, post_id, option_text, option_order, created_at )
        `,
      )
      .eq("status", "closed")
      .order("created_at", { ascending: false })
      .limit(50);

    const [activeRes, closedRes] = await Promise.all([activeReq, closedReq]);

    if (activeRes.error) console.error("[home] active query error", activeRes.error);
    if (closedRes.error) console.error("[home] closed query error", closedRes.error);

    let closedPosts = normalize(closedRes.data ?? []);

    // 종료된 게시글의 vote_count를 admin 클라이언트로 일괄 조회 (RLS 우회)
    if (closedPosts.length > 0) {
      try {
        const admin = createAdminClient();
        const optionIds = closedPosts.flatMap((p) => p.options.map((o) => o.id));
        const { data: voteCounts } = await admin
          .from("votes")
          .select("option_id")
          .in("option_id", optionIds);

        if (voteCounts) {
          const countMap: Record<string, number> = {};
          for (const v of voteCounts) {
            countMap[v.option_id] = (countMap[v.option_id] ?? 0) + 1;
          }
          closedPosts = closedPosts.map((post) => ({
            ...post,
            options: post.options.map((opt) => ({
              ...opt,
              vote_count: countMap[opt.id] ?? 0,
            })),
          }));
        }
      } catch (e) {
        console.error("[home] vote count batch failed — showing without counts", e);
      }
    }

    return {
      activePosts: normalize(activeRes.data ?? []),
      closedPosts,
      isDemo: false,
    };
  } catch (e) {
    console.error("[home] supabase load failed — fallback to demo", e);
    return { activePosts: DEMO_ACTIVE, closedPosts: DEMO_CLOSED, isDemo: true };
  }
}

/** Supabase 응답을 PostWithOptions 형태로 정규화 (author 가 배열로 올 수 있어 normalize) */
function normalize(rows: unknown[]): PostWithOptions[] {
  return rows.map((r) => {
    const row = r as Record<string, unknown>;
    const authorRaw = row.author as
      | { id: string; nickname: string; avatar_url: string | null }
      | { id: string; nickname: string; avatar_url: string | null }[]
      | null
      | undefined;
    const author = Array.isArray(authorRaw) ? authorRaw[0] ?? undefined : authorRaw ?? undefined;

    return {
      id: row.id as string,
      user_id: row.user_id as string,
      content: row.content as string,
      image_url: (row.image_url as string | null) ?? null,
      created_at: row.created_at as string,
      expires_at: row.expires_at as string,
      status: row.status as "active" | "closed",
      author: author
        ? { id: author.id, nickname: author.nickname, avatar_url: author.avatar_url }
        : undefined,
      options: ((row.options as Record<string, unknown>[] | null) ?? [])
        .map((o) => ({
          id: o.id as string,
          post_id: o.post_id as string,
          option_text: o.option_text as string,
          option_order: o.option_order as number,
          created_at: o.created_at as string,
        }))
        .sort((a, b) => a.option_order - b.option_order),
    };
  });
}

/* -------------------------------------------------------------------------- */
/* Demo data (Supabase 미설정 시)                                              */
/* -------------------------------------------------------------------------- */

const NOW = Date.now();
const HOUR = 3600 * 1000;

const DEMO_ACTIVE: PostWithOptions[] = [
  {
    id: "demo-active-1",
    user_id: "demo-user-1",
    content:
      "친구가 점심값을 빌리고 한 달째 안 갚네요. 직접 얘기해야 할까요?",
    image_url: null,
    created_at: new Date(NOW - 2 * HOUR).toISOString(),
    expires_at: new Date(NOW + 22 * HOUR).toISOString(),
    status: "active",
    author: { id: "demo-user-1", nickname: "고민러123", avatar_url: null },
    options: [
      { id: "o1", post_id: "demo-active-1", option_text: "직접 얘기한다", option_order: 1, created_at: "" },
      { id: "o2", post_id: "demo-active-1", option_text: "그냥 잊어준다", option_order: 2, created_at: "" },
      { id: "o3", post_id: "demo-active-1", option_text: "은근히 힌트만", option_order: 3, created_at: "" },
    ],
  },
  {
    id: "demo-active-2",
    user_id: "demo-user-2",
    content: "민트초코, 인정인가 부정인가?",
    image_url: null,
    created_at: new Date(NOW - 30 * 60 * 1000).toISOString(),
    expires_at: new Date(NOW + 23.5 * HOUR).toISOString(),
    status: "active",
    author: { id: "demo-user-2", nickname: "디저트킹", avatar_url: null },
    options: [
      { id: "o4", post_id: "demo-active-2", option_text: "민초 최고 🍫", option_order: 1, created_at: "" },
      { id: "o5", post_id: "demo-active-2", option_text: "치약 맛 ㄴㄴ", option_order: 2, created_at: "" },
    ],
  },
];

const DEMO_CLOSED: PostWithOptions[] = [
  {
    id: "demo-closed-1",
    user_id: "demo-user-3",
    content: "결혼식에 전 여친을 초대하는 친구, 정상인가요?",
    image_url: null,
    created_at: new Date(NOW - 30 * HOUR).toISOString(),
    expires_at: new Date(NOW - 6 * HOUR).toISOString(),
    status: "closed",
    author: { id: "demo-user-3", nickname: "결혼고민중", avatar_url: null },
    options: [
      { id: "c1", post_id: "demo-closed-1", option_text: "이상하다", option_order: 1, created_at: "", vote_count: 78 },
      { id: "c2", post_id: "demo-closed-1", option_text: "친구는 친구", option_order: 2, created_at: "", vote_count: 22 },
    ],
  },
];
