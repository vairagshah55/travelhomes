import { useEffect, useRef } from "react";

interface UseAutoHorizontalScrollProps {
  cardWidth?: number;
  delay?: number;
}

export function useAutoHorizontalScroll({
  cardWidth,
  delay,
}: UseAutoHorizontalScrollProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollRight = () => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const maxScrollLeft = container.scrollWidth - container.clientWidth;
    const step = cardWidth || container.clientWidth;

    // If we're close to the end, loop back to start
    if (container.scrollLeft >= maxScrollLeft - 10) {
      container.scrollTo({ left: 0, behavior: "smooth" });
    } else {
      container.scrollBy({
        left: step,
        behavior: "smooth",
      });
    }
  };

  const scrollLeft = () => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const maxScrollLeft = container.scrollWidth - container.clientWidth;
    const step = cardWidth || container.clientWidth;

    // If we're close to the start, loop to end
    if (container.scrollLeft <= 10) {
      container.scrollTo({ left: maxScrollLeft, behavior: "smooth" });
    } else {
      container.scrollBy({
        left: -step,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    if (!delay) return;
    const interval = setInterval(scrollRight, delay);
    return () => clearInterval(interval);
  }, [delay, cardWidth]);

  return {
    scrollRef,
    scrollLeft,
    scrollRight,
  };
}
