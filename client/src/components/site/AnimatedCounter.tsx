import React, { useEffect, useState, useRef } from "react";

interface AnimatedCounterProps {
  end?: number;
  range?: [number, number];
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}

export function AnimatedCounter({
  end,
  range,
  decimals = 0,
  prefix = "",
  suffix = "",
  duration = 1400,
}: AnimatedCounterProps) {
  const [display, setDisplay] = useState<string>(() => {
    if (range) return `0–0`;
    if (end !== undefined) return decimals > 0 ? (0).toFixed(decimals) : "0";
    return "";
  });
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const startTime = performance.now();

          const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Quartic ease-out for smooth luxurious deceleration
            const ease = 1 - Math.pow(1 - progress, 4);

            if (range) {
              const [minTarget, maxTarget] = range;
              const curMin = Math.round(minTarget * ease);
              const curMax = Math.round(maxTarget * ease);
              setDisplay(`${curMin}–${curMax}`);
            } else if (end !== undefined) {
              const current = end * ease;
              setDisplay(decimals > 0 ? current.toFixed(decimals) : Math.round(current).toString());
            }

            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              // Ensure precise final value
              if (range) {
                setDisplay(`${range[0]}–${range[1]}`);
              } else if (end !== undefined) {
                setDisplay(decimals > 0 ? end.toFixed(decimals) : end.toString());
              }
            }
          };

          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [end, range, decimals, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {display}
      {suffix}
    </span>
  );
}
