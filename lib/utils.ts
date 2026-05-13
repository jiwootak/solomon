/**
 * 공통 유틸.
 * cn() — Tailwind 클래스 머지.
 *
 * NOTE: 이 모듈은 `clsx`, `tailwind-merge` 패키지에 의존한다.
 *       `npm i clsx tailwind-merge` 로 추가 설치 필요.
 */
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * 만료까지 남은 시간을 "12시간 34분" 형태로 포맷.
 */
export function formatRemaining(ms: number): string {
  if (ms <= 0) return "종료됨";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}시간 ${m}분`;
  if (m > 0) return `${m}분 ${s}초`;
  return `${s}초`;
}
