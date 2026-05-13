"use client";

interface TitleBadgeProps {
  title: string;
  size?: "sm" | "md" | "lg";
}

const titleColorMap: Record<string, string> = {
  "👑 진정한 솔로몬": "bg-amber-100 text-amber-800 border-amber-300",
  "⚖️ 현명한 판단자": "bg-indigo-100 text-indigo-800 border-indigo-300",
  "🤔 고민하는 시민": "bg-slate-100 text-slate-700 border-slate-300",
  "🌊 역류하는 물고기": "bg-blue-100 text-blue-800 border-blue-300",
  "🎸 마이웨이 힙스터": "bg-purple-100 text-purple-800 border-purple-300",
  "🌱 새내기 시민": "bg-green-100 text-green-800 border-green-300",
};

const sizeMap = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-3 py-1 text-sm",
  lg: "px-4 py-1.5 text-base",
};

export default function TitleBadge({ title, size = "md" }: TitleBadgeProps) {
  const colorClass = titleColorMap[title] ?? "bg-slate-100 text-slate-700 border-slate-300";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-medium ${colorClass} ${sizeMap[size]}`}
    >
      {title}
    </span>
  );
}
