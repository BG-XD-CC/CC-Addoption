"use client";

import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import type { CelebrationItem } from "@/types";

export function CelebrationConfetti({
  celebrations,
}: {
  celebrations: CelebrationItem[];
}) {
  const hasTodayCelebration = celebrations.some((c) => c.daysUntil <= 0);
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (!hasTodayCelebration) return;

    cancelledRef.current = false;
    const duration = 2000;
    const end = Date.now() + duration;
    let rafId: number;

    const frame = () => {
      if (cancelledRef.current) return;

      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#3b82f6", "#06b6d4", "#8b5cf6"],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#3b82f6", "#06b6d4", "#8b5cf6"],
      });

      if (Date.now() < end) {
        rafId = requestAnimationFrame(frame);
      }
    };

    frame();

    return () => {
      cancelledRef.current = true;
      cancelAnimationFrame(rafId);
      confetti.reset();
    };
  }, [hasTodayCelebration]);

  return null;
}
