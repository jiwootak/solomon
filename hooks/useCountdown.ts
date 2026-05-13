"use client";

/**
 * useCountdown — ISO 문자열 만료 시각을 받아 남은 시간을 1초 단위로 갱신.
 *
 * @example
 *   const { displayText, urgent, expired } = useCountdown(post.expires_at);
 *   // displayText: "23:59:59" / "종료됨"
 *   // urgent: 1시간 미만 남았을 때 true (빨간색 표시 신호)
 */
import { useEffect, useState } from "react";

export interface CountdownState {
  hours: number;
  minutes: number;
  seconds: number;
  /** 24시간 이상 남았을 때만 양수 — "X일 Y시간 Z분" 표시용 */
  days: number;
  expired: boolean;
  /** 1시간 미만 남았으면 true (UI 빨간색 강조용) */
  urgent: boolean;
  /** 그대로 화면에 그릴 수 있는 텍스트.
   *  - 24h 이상: "1일 3시간 12분"
   *  - 1h 이상 24h 미만: "23:59:59"
   *  - 1h 미만: "59:59" (mm:ss)
   *  - 만료: "종료됨" */
  displayText: string;
}

function calc(target: number, now: number): CountdownState {
  const diff = target - now;
  if (diff <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      expired: true,
      urgent: false,
      displayText: "종료됨",
    };
  }

  const totalSec = Math.floor(diff / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  // 1시간 미만 = urgent (빨간색)
  const urgent = days === 0 && hours === 0;

  let displayText: string;
  if (days >= 1) {
    // "X일 Y시간 Z분"
    displayText = `${days}일 ${hours}시간 ${minutes}분`;
  } else if (hours >= 1) {
    // HH:MM:SS — 시간 단위는 한 자리/두 자리 어느 쪽이든 그대로
    displayText = `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`;
  } else {
    // mm:ss
    displayText = `${pad2(minutes)}:${pad2(seconds)}`;
  }

  return { days, hours, minutes, seconds, expired: false, urgent, displayText };
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function useCountdown(expiresAt: string): CountdownState {
  const target = new Date(expiresAt).getTime();
  const [state, setState] = useState<CountdownState>(() => calc(target, Date.now()));

  useEffect(() => {
    // expiresAt 변경 즉시 1회 갱신
    setState(calc(target, Date.now()));

    const id = setInterval(() => {
      setState((prev) => {
        const next = calc(target, Date.now());
        // 만료 후에는 더 이상 갱신할 필요 없음 — interval 은 cleanup 에서 정리됨
        if (prev.expired && next.expired) return prev;
        return next;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [target]);

  return state;
}

export default useCountdown;
