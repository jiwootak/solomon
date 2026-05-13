import { redirect } from "next/navigation";
import Link from "next/link";
import { Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSolomonData } from "@/lib/solomon";
import SolomonIndexGauge from "@/components/profile/SolomonIndexGauge";
import TitleBadge from "@/components/profile/TitleBadge";
import NicknameEditor from "@/components/profile/NicknameEditor";
import type { Post, User } from "@/types/solomon";

export const dynamic = "force-dynamic";

interface VotedPost {
  post_id: string;
  option_id: string;
  posts: Pick<Post, "id" | "content" | "status" | "expires_at" | "created_at"> | null;
}

export default async function MyPage() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) redirect("/login");

  const [
    { data: user },
    { data: authored_posts },
    { data: votes },
  ] = await Promise.all([
    supabase.from("users").select("*").eq("id", authUser.id).maybeSingle(),
    supabase
      .from("posts")
      .select("id, content, status, expires_at, created_at")
      .eq("user_id", authUser.id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("votes")
      .select("post_id, option_id, posts(id, content, status, expires_at, created_at)")
      .eq("user_id", authUser.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  if (!user) redirect("/login");

  const solomon_index = getSolomonData(user as User);
  const voted_posts = (votes ?? []) as VotedPost[];

  return (
    <main className="relative max-w-lg mx-auto px-4 py-6 pb-24">
      <Link
        href="/settings"
        className="absolute right-4 top-6 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        aria-label="설정"
      >
        <Settings size={20} />
      </Link>

      {/* 프로필 헤더 */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-600">
          {user.nickname[0]?.toUpperCase() ?? "?"}
        </div>
        <div className="flex-1">
          <NicknameEditor initialNickname={user.nickname} />
        </div>
      </div>

      {/* 솔로몬 지수 */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6 flex flex-col items-center gap-3">
        <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wide">솔로몬 지수</h2>
        <SolomonIndexGauge index={solomon_index.index} size="lg" />
        <TitleBadge title={solomon_index.title} size="md" />
        <p className="text-xs text-slate-400 mt-1">나의 선택이 다수결과 일치한 비율이에요</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-indigo-50 rounded-2xl p-4">
          <div className="text-2xl font-bold text-indigo-700">{solomon_index.total_votes}</div>
          <div className="text-xs text-indigo-500 mt-0.5">총 투표 참여</div>
        </div>
        <div className="bg-amber-50 rounded-2xl p-4">
          <div className="text-2xl font-bold text-amber-600">{solomon_index.matched}</div>
          <div className="text-xs text-amber-500 mt-0.5">다수결 일치</div>
        </div>
      </div>

      {/* 탭 콘텐츠 */}
      <ProfileTabs
        authored_posts={authored_posts ?? []}
        voted_posts={voted_posts}
      />
    </main>
  );
}

function ProfileTabs({
  authored_posts,
  voted_posts,
}: {
  authored_posts: Pick<Post, "id" | "content" | "status" | "expires_at" | "created_at">[];
  voted_posts: VotedPost[];
}) {
  return (
    <div>
      {/* 탭 헤더 — 정적 표시, JS 없이도 작동 */}
      <div className="flex border-b border-slate-200 mb-4">
        <span className="flex-1 py-2 text-sm font-medium text-center text-indigo-600 border-b-2 border-indigo-600">
          내 게시글 ({authored_posts.length})
        </span>
        <Link
          href="/my?tab=voted"
          className="flex-1 py-2 text-sm font-medium text-center text-slate-500"
        >
          투표한 게시글 ({voted_posts.length})
        </Link>
      </div>

      {/* 기본 탭: 내 게시글 */}
      <div className="space-y-3">
        {authored_posts.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <p className="text-3xl mb-2">✏️</p>
            <p className="text-sm">아직 작성한 게시글이 없어요</p>
            <Link href="/post/create" className="mt-3 inline-block text-sm text-indigo-600 font-medium">
              첫 게시글 올리기 →
            </Link>
          </div>
        ) : (
          authored_posts.map((post) => (
            <Link
              key={post.id}
              href={`/post/${post.id}`}
              className="block bg-white rounded-2xl border border-slate-100 p-4 hover:border-indigo-200 transition-colors"
            >
              <p className="text-sm text-slate-800 line-clamp-2">{post.content}</p>
              <span className={`mt-2 inline-block text-xs px-2 py-0.5 rounded-full ${
                post.status === "active" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
              }`}>
                {post.status === "active" ? "진행중" : "종료됨"}
              </span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
