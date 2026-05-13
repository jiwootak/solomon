import { notFound } from "next/navigation";
import Link from "next/link";
import SolomonIndexGauge from "@/components/profile/SolomonIndexGauge";
import TitleBadge from "@/components/profile/TitleBadge";

interface PageProps {
  params: Promise<{ id: string }>;
}

const UUID_RE =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export default async function ProfilePage({ params }: PageProps) {
  const { id } = await params;

  if (!UUID_RE.test(id)) notFound();

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/profile/${id}`, { next: { revalidate: 60 } });

  if (!res.ok) notFound();

  const { user, solomon_index, authored_posts } = await res.json();

  return (
    <main className="max-w-lg mx-auto px-4 py-6 pb-24">
      {/* 프로필 헤더 */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-600">
          {user.nickname[0]?.toUpperCase() ?? "?"}
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900">{user.nickname}</h1>
          <TitleBadge title={solomon_index.title} size="sm" />
        </div>
      </div>

      {/* 솔로몬 지수 */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6 flex flex-col items-center gap-3">
        <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wide">솔로몬 지수</h2>
        <SolomonIndexGauge index={solomon_index.index} size="md" />
        <div className="flex gap-6 text-center">
          <div>
            <div className="text-xl font-bold text-slate-800">{solomon_index.total_votes}</div>
            <div className="text-xs text-slate-400">총 투표</div>
          </div>
          <div>
            <div className="text-xl font-bold text-amber-500">{solomon_index.matched}</div>
            <div className="text-xs text-slate-400">다수결 일치</div>
          </div>
        </div>
      </div>

      {/* 작성한 게시글 */}
      <h3 className="text-sm font-semibold text-slate-700 mb-3">작성한 게시글</h3>
      {authored_posts.length === 0 ? (
        <p className="text-sm text-slate-400 py-8 text-center">아직 게시글이 없어요</p>
      ) : (
        <div className="space-y-3">
          {authored_posts.slice(0, 5).map((post: { id: string; content: string; status: string }) => (
            <Link
              key={post.id}
              href={`/post/${post.id}`}
              className="block bg-white rounded-2xl border border-slate-100 p-4 hover:border-indigo-200 transition-colors"
            >
              <p className="text-sm text-slate-800 line-clamp-2">{post.content}</p>
              <span
                className={`mt-2 inline-block text-xs px-2 py-0.5 rounded-full ${
                  post.status === "active"
                    ? "bg-green-100 text-green-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {post.status === "active" ? "진행중" : "종료됨"}
              </span>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
