"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";

interface SolomonIndexGaugeProps {
  index: number;
  size?: "sm" | "md" | "lg";
}

function getGaugeColor(index: number): string {
  if (index >= 90) return "#f59e0b"; // amber-400
  if (index >= 70) return "#6366f1"; // indigo-500
  if (index >= 50) return "#64748b"; // slate-500
  if (index >= 30) return "#60a5fa"; // blue-400
  return "#a855f7"; // purple-500
}

const sizeConfig = {
  sm: { r: 36, strokeWidth: 6, textSize: "text-lg" },
  md: { r: 52, strokeWidth: 8, textSize: "text-2xl" },
  lg: { r: 68, strokeWidth: 10, textSize: "text-3xl" },
};

export default function SolomonIndexGauge({ index, size = "md" }: SolomonIndexGaugeProps) {
  const { r, strokeWidth, textSize } = sizeConfig[size];
  const circumference = 2 * Math.PI * r;
  const svgSize = (r + strokeWidth + 4) * 2;

  const motionValue = useMotionValue(0);
  const displayValue = useTransform(motionValue, (v) => Math.round(v));
  const [displayNum, setDisplayNum] = useState(0);
  const [offset, setOffset] = useState(circumference);
  const color = getGaugeColor(index);

  useEffect(() => {
    const controls = animate(motionValue, index, {
      duration: 1.5,
      ease: "easeOut",
    });

    const unsubscribe = displayValue.on("change", (v) => {
      setDisplayNum(Math.round(v));
      setOffset(circumference - (v / 100) * circumference);
    });

    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [index, circumference, displayValue, motionValue]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: svgSize, height: svgSize }}>
        <svg width={svgSize} height={svgSize} className="-rotate-90">
          {/* 배경 트랙 */}
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={r}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
          />
          {/* 진행 호 */}
          <motion.circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.05s linear" }}
          />
        </svg>
        {/* 중앙 숫자 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-bold ${textSize}`} style={{ color }}>
            {displayNum}
          </span>
          <span className="text-xs text-slate-500">점</span>
        </div>
      </div>
    </div>
  );
}
