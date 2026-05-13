"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import SolomonIndexGauge from "@/components/profile/SolomonIndexGauge";
import TitleBadge from "@/components/profile/TitleBadge";
import type { User, SolomonIndex, Post } from "@/types/solomon";

interface VotedPost {
  post_id: string;
  option_id: string;
  posts: Pick<Post, "id" | "content" | "status" | "expires_at" | "created_at"> | null;
}

interface ProfileData {
  user: User;
  solomon_index: SolomonIndex;
  authored_posts: Pick<Post, "id" | "content" | "status" | "expires_at" | "created_at">[];
  voted_posts: VotedPost[];
}

const DEMO_PROFILE: ProfileData = {
  user: {
    id: "demo",
    nickname: "솔로몬 체험자",
    avatar_url: null,
    total_votes: 12,
    majority_matched_votes: 9,
    created_at: new Date().toISOString(),
  },
  solomon_index: { user_id: "demo", index: 75, title: "⚖️ 현명한 판단자", total_votes: 12, matched: 9 },
  authored_posts: [],
  voted_posts: [],
};

export default function MyPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [activeTab, setActiveTab] = useState<"authored" | "voted">("authored");
  const [editingNickname, setEditingNickname] = useState(false);
  const [nicknameInput, setNicknameInput] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setProfile(DEMO_PROFILE);
      setIsDemo(true);
      return;
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push("/login");
        return;
      }
      fetch("/api/profile/me")
        .then((r) => r.json())
        .then((data) => {
          if (data.error) {
            setProfile(DEMO_PROFILE);
            setIsDemo(true);
          } else {
            setProfile(data);
            setNicknameInput(data.user.nickname);
          }
        })
        .catch(() => {
          setProfile(DEMO_PROFILE);
          setIsDemo(true);
        });
    });
  }, [router]);

  const handleSaveNickname = async () => {
    if (!nicknameInput.trim() || isDemo) return;
    setSaving(true);
    try {
      const res = await fetch("/api/profile/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: nicknameInput }),
      });
      if (res.ok) {
        const { user } = await res.json();
        setProfile((prev) => prev ? { ...prev, user } : prev);
        setEditingNickname(false);
      }
    } finally {
      setSaving(false);
    }
  };

  if (!profile) return null;

  const { user, solomon_index, authored_posts } = profile;

  return (
    <main className="relative max-w-lg mx-auto px-4 py-6 pb-24">
      {isDemo && (
        <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-2 text-sm text-amber-700">
          데모 모드 — Supabase 연결 후 실제 프로필이 표시됩니다
        </div>
      )}

      {/* 프로필 헤더 */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/settings"
          className="absolute right-4 top-6 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="설정"
        >
          <Settings size={20} />
        </Link>
        <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-600">
          {user.nickname[0]?.toUpperCase() ?? "?"}
        </div>
        <div className="flex-1">
          {editingNickname ? (
            <div className="flex items-center gap-2">
              <input
                value={nicknameInput}
                onChange={(e) => setNicknameInput(e.target.value)}
                className="border border-indigo-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                maxLength={20}
              />
              <button
                onClick={handleSaveNickname}
                disabled={saving}
                className="text-xs bg-indigo-600 text-white px-3 py-1 rounded-lg disabled:opacity-50"
              >
                {saving ? "저장중..." : "저장"}
              </button>
              <button onClick={() => setEditingNickname(false)} className="text-xs text-slate-500">
                취소
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900">{user.nickname}</h1>
              {!isDemo && (
                <button
                  onClick={() => { setEditingNickname(true); setNicknameInput(user.nickname); }}
                  className="text-xs text-slate-400 hover:text-indigo-600"
                >
                  수정
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 솔로몬 지수 */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6 flex flex-col items-center gap-3">
        <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wide">솔로몬 지수</h2>
        <SolomonIndexGauge index={solomon_index.index} size="lg" />
        <TitleBadge title={solomon_index.title} size="md" />
        <p className="text-xs text-slate-400 mt-1">
          나의 선택이 다수결과 일치한 비율이에요
        </p>
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

      {/* 탭 */}
      <div className="flex border-b border-slate-200 mb-4">
        {(["authored", "voted"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              activeTab === tab
                ? "text-indigo-600 border-b-2 border-indigo-600"
                : "text-slate-500"
            }`}
          >
            {tab === "authored" ? "내 게시글" : "투표한 게시글"}
          </button>
        ))}
      </div>

      {/* 탭 콘텐츠 */}
      {activeTab === "authored" && (
        <div className="space-y-3">
          {authored_posts.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p className="text-3xl mb-2">✏️</p>
              <p className="text-sm">아직 작성한 게시글이 없어요</p>
              <Link
                href="/post/create"
                className="mt-3 inline-block text-sm text-indigo-600 font-medium"
              >
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
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      post.status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {post.status === "active" ? "진행중" : "종료됨"}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      )}

      {activeTab === "voted" && (
        <div className="space-y-3">
          {profile.voted_posts.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p className="text-3xl mb-2">🗳️</p>
              <p className="text-sm">아직 투표한 게시글이 없어요</p>
            </div>
          ) : (
            profile.voted_posts.map((vote) => {
              const post = vote.posts;
              if (!post) return null;
              const isActive = post.status === "active" && new Date(post.expires_at) > new Date();
              return (
                <Link
                  key={vote.post_id}
                  href={`/post/${post.id}`}
                  className="block bg-white rounded-2xl border border-slate-100 p-4 hover:border-indigo-200 transition-colors"
                >
                  <p className="text-sm text-slate-800 line-clamp-2">{post.content}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {isActive ? "진행중" : "종료됨"}
                    </span>
                    <span className="text-xs text-indigo-500">투표 완료 ✓</span>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      )}
    </main>
  );
}
