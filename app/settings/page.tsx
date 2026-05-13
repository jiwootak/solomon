"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

const APP_VERSION = "1.0.0";

interface ConfirmModal {
  type: "logout" | "delete";
}

export default function SettingsPage() {
  const router = useRouter();
  const [modal, setModal] = useState<ConfirmModal | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");

  const handleLogout = async () => {
    const supabase = createClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleDeleteAccount = async () => {
    if (deleteInput !== "탈퇴") return;
    setDeleting(true);
    try {
      const res = await fetch("/api/account/delete", { method: "DELETE" });
      if (!res.ok) throw new Error();
      const supabase = createClient();
      if (supabase) await supabase.auth.signOut();
      toast.success("계정이 삭제되었습니다.");
      router.push("/login");
    } catch {
      toast.error("계정 삭제에 실패했어요. 다시 시도해주세요.");
      setDeleting(false);
    }
  };

  return (
    <main className="max-w-lg mx-auto px-4 py-6 pb-24">
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => router.back()} className="text-slate-500 hover:text-slate-700">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <h1 className="text-lg font-bold text-slate-900">설정</h1>
      </div>

      <div className="space-y-3">
        {/* 서비스 정보 */}
        <SectionLabel>서비스 정보</SectionLabel>
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <SettingsLink href="/terms">이용약관</SettingsLink>
          <SettingsLink href="/privacy">개인정보처리방침</SettingsLink>
          <SettingsRow
            label="버전 정보"
            right={<span className="text-sm text-slate-400">{APP_VERSION}</span>}
          />
        </div>

        {/* 문의 */}
        <SectionLabel>지원</SectionLabel>
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <SettingsLink href="mailto:jwootak0403@gmail.com" external>
            문의하기
          </SettingsLink>
        </div>

        {/* 계정 */}
        <SectionLabel>계정</SectionLabel>
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <SettingsButton onClick={() => setModal({ type: "logout" })}>
            로그아웃
          </SettingsButton>
          <SettingsButton onClick={() => { setModal({ type: "delete" }); setDeleteInput(""); }} danger>
            회원탈퇴
          </SettingsButton>
        </div>
      </div>

      {/* 로그아웃 확인 모달 */}
      {modal?.type === "logout" && (
        <Modal onClose={() => setModal(null)}>
          <div className="p-6">
            <h2 className="text-base font-bold text-slate-900 mb-2">로그아웃</h2>
            <p className="text-sm text-slate-600 mb-6">정말 로그아웃 하시겠어요?</p>
            <div className="flex gap-2">
              <button
                onClick={() => setModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 font-medium"
              >
                취소
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-sm text-white font-medium"
              >
                로그아웃
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* 회원탈퇴 확인 모달 */}
      {modal?.type === "delete" && (
        <Modal onClose={() => setModal(null)}>
          <div className="p-6">
            <h2 className="text-base font-bold text-red-600 mb-2">회원탈퇴</h2>
            <p className="text-sm text-slate-600 mb-1">
              탈퇴 시 모든 게시글·투표 기록·솔로몬 지수가 영구 삭제됩니다.
            </p>
            <p className="text-sm text-slate-600 mb-4">
              이 작업은 되돌릴 수 없습니다.
            </p>
            <p className="text-xs text-slate-500 mb-2">
              확인을 위해 아래에 <strong className="text-slate-700">탈퇴</strong>를 입력하세요.
            </p>
            <input
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder="탈퇴"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-red-300"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 font-medium"
              >
                취소
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteInput !== "탈퇴" || deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-sm text-white font-medium disabled:opacity-40"
              >
                {deleting ? "삭제 중..." : "탈퇴하기"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </main>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-1 text-xs font-semibold text-slate-400 uppercase tracking-wide">
      {children}
    </p>
  );
}

function SettingsLink({ href, children, external }: { href: string; children: React.ReactNode; external?: boolean }) {
  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
    >
      <span className="text-sm text-slate-800">{children}</span>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-300">
        <path d="M9 18l6-6-6-6"/>
      </svg>
    </Link>
  );
}

function SettingsRow({ label, right }: { label: string; right: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-800">{label}</span>
      {right}
    </div>
  );
}

function SettingsButton({ children, onClick, danger }: { children: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-3.5 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors text-left ${
        danger ? "text-red-500" : "text-slate-800"
      }`}
    >
      <span className="text-sm font-medium">{children}</span>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-300">
        <path d="M9 18l6-6-6-6"/>
      </svg>
    </button>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pb-8"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
