"use client";

import { useState } from "react";

export default function NicknameEditor({ initialNickname }: { initialNickname: string }) {
  const [editing, setEditing] = useState(false);
  const [nickname, setNickname] = useState(initialNickname);
  const [input, setInput] = useState(initialNickname);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!input.trim() || input.trim() === nickname) { setEditing(false); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/profile/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: input.trim() }),
      });
      if (res.ok) {
        const { user } = await res.json();
        setNickname(user.nickname);
        setEditing(false);
      }
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="border border-indigo-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          maxLength={20}
          autoFocus
        />
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-xs bg-indigo-600 text-white px-3 py-1 rounded-lg disabled:opacity-50"
        >
          {saving ? "저장중..." : "저장"}
        </button>
        <button onClick={() => setEditing(false)} className="text-xs text-slate-500">취소</button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <h1 className="text-lg font-bold text-slate-900">{nickname}</h1>
      <button
        onClick={() => { setInput(nickname); setEditing(true); }}
        className="text-xs text-slate-400 hover:text-indigo-600"
      >
        수정
      </button>
    </div>
  );
}
