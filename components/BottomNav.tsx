"use client";

/**
 * 하단 네비게이션 (홈 / 작성 / 내 프로필)
 * - 인디고 색상 = 활성 탭
 * - 중앙 "작성" 버튼은 인디고 배경 원형으로 강조
 * - lucide-react 미설치 — 인라인 SVG 사용
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  match: (path: string) => boolean;
};

const NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    label: "홈",
    match: (p) => p === "/" || p.startsWith("/post/") && !p.startsWith("/post/create"),
  },
  {
    href: "/post/create",
    label: "작성",
    match: (p) => p.startsWith("/post/create"),
  },
  {
    href: "/my",
    label: "내 프로필",
    match: (p) => p === "/my" || p.startsWith("/profile/"),
  },
];

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1V9.5z" />
    </svg>
  );
}

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.418 3.582-8 8-8s8 3.582 8 8" />
    </svg>
  );
}

export default function BottomNav() {
  const pathname = usePathname() || "/";

  // 인증 페이지 / 테스트 페이지에서는 숨김
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/test")
  ) {
    return null;
  }

  const [home, create, my] = NAV_ITEMS;
  const isActive = (item: NavItem) => item.match(pathname);

  return (
    <nav
      aria-label="하단 네비게이션"
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 safe-bottom"
    >
      <div className="container-mobile flex h-16 items-center justify-around">
        {/* 홈 */}
        <NavLink item={home} active={isActive(home)} icon={HomeIcon} />

        {/* 작성 (강조 버튼) */}
        <Link
          href={create.href}
          aria-label={create.label}
          className={cn(
            "flex flex-col items-center justify-center -mt-6",
            "transition-transform active:scale-95",
          )}
        >
          <span
            className={cn(
              "flex h-14 w-14 items-center justify-center rounded-full",
              "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30",
              "ring-4 ring-white",
              isActive(create) && "bg-indigo-700",
            )}
          >
            <PencilIcon className="h-6 w-6" />
          </span>
          <span
            className={cn(
              "mt-0.5 text-[11px] font-medium",
              isActive(create) ? "text-indigo-600" : "text-slate-500",
            )}
          >
            {create.label}
          </span>
        </Link>

        {/* 내 프로필 */}
        <NavLink item={my} active={isActive(my)} icon={UserIcon} />
      </div>
    </nav>
  );
}

/* -------------------------------------------------------------------------- */

function NavLink({
  item,
  active,
  icon: Icon,
}: {
  item: NavItem;
  active: boolean;
  icon: (props: { className?: string }) => JSX.Element;
}) {
  return (
    <Link
      href={item.href}
      aria-label={item.label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-1 py-2",
        "text-xs font-medium transition-colors",
        active ? "text-indigo-600" : "text-slate-500 hover:text-slate-700",
      )}
    >
      <Icon className="h-6 w-6" />
      <span>{item.label}</span>
    </Link>
  );
}
