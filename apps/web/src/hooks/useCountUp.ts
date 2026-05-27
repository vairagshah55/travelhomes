import { useEffect, useRef, useState } from "react";

/**
 * Animate a number from its previous value up to `target` with an ease-out
 * cubic over `duration` ms. Re-runs whenever `target` changes, animating from
 * wherever it last settled (so stat cards count up smoothly on refresh, not
 * from zero every time).
 *
 * Extracted from AdminDashboard's inline StatCard so AdminStatCard and any
 * future metric widget share one implementation.
 */
export function useCountUp(target: number, duration = 900): number {
  const [count, setCount] = useState(0);
  const prev = useRef(0);

  useEffect(() => {
    const start = prev.current;
    const diff = target - start;
    if (diff === 0) return;

    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setCount(Math.round(start + diff * ease));
      if (progress < 1) requestAnimationFrame(tick);
      else prev.current = target;
    };
    requestAnimationFrame(tick);
  }, [target, duration]);

  return count;
}

export default useCountUp;
