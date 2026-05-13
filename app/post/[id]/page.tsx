import type { Metadata } from "next";
import PostDetailClient from "./PostDetailClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  if (!UUID_RE.test(id)) return baseMetadata();

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data: post } = await supabase
      .from("posts")
      .select("content, expires_at, status")
      .eq("id", id)
      .maybeSingle();

    if (!post) return baseMetadata();

    const isExpired =
      post.status === "closed" || new Date(post.expires_at) < new Date();
    const title = post.content.length > 55
      ? post.content.slice(0, 55) + "…"
      : post.content;
    const description = isExpired
      ? "투표가 종료되었습니다. 솔로몬의 선택을 확인해보세요!"
      : "지금 투표에 참여해보세요! 24시간 후 결과가 공개됩니다.";

    return {
      title: `${title} | 모두의 솔로몬`,
      description,
      openGraph: {
        title: `⚖️ ${title}`,
        description,
        siteName: "모두의 솔로몬",
        type: "website",
      },
      twitter: {
        card: "summary",
        title: `⚖️ ${title}`,
        description,
      },
    };
  } catch {
    return baseMetadata();
  }
}

function baseMetadata(): Metadata {
  return {
    title: "모두의 솔로몬",
    description: "24시간 블라인드 투표 커뮤니티",
  };
}

export default function PostDetailPage() {
  return <PostDetailClient />;
}
