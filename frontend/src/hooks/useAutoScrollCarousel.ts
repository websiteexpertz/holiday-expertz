"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useSyncExternalStore,
} from "react";

// External store subscriptions for reduced motion, page visibility, and window resize (React 19 compliant)
const subscribeReducedMotion = (callback: () => void) => {
  if (typeof window === "undefined") return () => { };
  const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  mediaQuery.addEventListener("change", callback);
  return () => mediaQuery.removeEventListener("change", callback);
};
const getReducedMotionSnapshot = () => {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};
const getReducedMotionServerSnapshot = () => false;

const subscribeVisibility = (callback: () => void) => {
  if (typeof document === "undefined") return () => { };
  document.addEventListener("visibilitychange", callback);
  return () => document.removeEventListener("visibilitychange", callback);
};
const getVisibilitySnapshot = () => {
  if (typeof document === "undefined") return true;
  return !document.hidden;
};
const getVisibilityServerSnapshot = () => true;

const subscribeResize = (callback: () => void) => {
  if (typeof window === "undefined") return () => { };
  window.addEventListener("resize", callback);
  return () => window.removeEventListener("resize", callback);
};
const getWindowWidthSnapshot = () => {
  if (typeof window === "undefined") return 1200;
  return window.innerWidth;
};
const getWindowWidthServerSnapshot = () => 1200;

export interface SetMetrics {
  setWidth: number;
  cardWidth: number;
  gap: number;
  step: number;
}

export interface UseAutoScrollCarouselOptions {
  itemsCount: number;
  speed?: number; // default 0.62 px / frame (~38px/s at 60fps)
  activeFilterKey?: string | number; // triggers reset/re-measurement when changed
  pauseOnHover?: boolean; // default false: auto-scroll continues with or without cursor
  isModalOpen?: boolean; // pause auto-scroll when a card detail modal is active
}

export function useAutoScrollCarousel({
  itemsCount,
  speed = 0.62,
  activeFilterKey,
  pauseOnHover = false,
  isModalOpen = false,
}: UseAutoScrollCarouselOptions) {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isUserPaused, setIsUserPaused] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isInteracting, setIsInteracting] = useState<boolean>(false);
  const [isInView, setIsInView] = useState<boolean>(true);

  const sectionRef = useRef<HTMLElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);
  const interactionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const scrollThrottleRef = useRef<number>(0);
  const setMetricsRef = useRef<SetMetrics | null>(null);

  // Subscriptions
  const isPageVisible = useSyncExternalStore(
    subscribeVisibility,
    getVisibilitySnapshot,
    getVisibilityServerSnapshot
  );
  const prefersReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  );
  const windowWidth = useSyncExternalStore(
    subscribeResize,
    getWindowWidthSnapshot,
    getWindowWidthServerSnapshot
  );

  // Responsive card count: desktop >= 1024px: 4, tablet 640-1023px: 2, mobile < 640px: 1
  const visibleCount = windowWidth >= 1024 ? 4 : windowWidth >= 640 ? 2 : 1;

  // Can auto-scroll when there are more items than visible slots
  const canAutoScroll = itemsCount > visibleCount;

  // Active condition flag: continues smoothly with or without cursor
  const isAutoScrolling =
    canAutoScroll &&
    !isUserPaused &&
    (!pauseOnHover || !isHovered) &&
    !isInteracting &&
    !isModalOpen &&
    isInView &&
    isPageVisible &&
    !prefersReducedMotion;

  const isAutoScrollingRef = useRef<boolean>(isAutoScrolling);
  useEffect(() => {
    isAutoScrollingRef.current = isAutoScrolling;
    if (isAutoScrolling) {
      lastTimestampRef.current = null;
    }
  }, [isAutoScrolling]);

  // Viewport intersection observer
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.15 }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  // Measure metrics from rendered DOM cards
  const measureMetrics = useCallback((): SetMetrics | null => {
    if (!scrollRef.current || !canAutoScroll) return null;
    const cards = scrollRef.current.querySelectorAll<HTMLElement>("[data-carousel-card]");
    if (cards.length < 3 * itemsCount) return null;

    const card0 = cards[0];
    const cardN = cards[itemsCount];
    if (!card0 || !cardN) return null;

    const setWidth = cardN.offsetLeft - card0.offsetLeft;
    const cardWidth = card0.offsetWidth;
    const gap = cards.length > 1 ? cards[1].offsetLeft - card0.offsetLeft - cardWidth : 24;
    const step = cardWidth + gap;

    return { setWidth, cardWidth, gap, step };
  }, [canAutoScroll, itemsCount]);

  // Position at Set 1 on mount or filter change
  useEffect(() => {
    const timer = setTimeout(() => {
      const metrics = measureMetrics();
      setMetricsRef.current = metrics;

      if (scrollRef.current) {
        if (canAutoScroll && metrics && metrics.setWidth > 0) {
          scrollRef.current.scrollLeft = metrics.setWidth;
        } else {
          scrollRef.current.scrollLeft = 0;
        }
      }
      setActiveIndex(0);
    }, 50);

    return () => clearTimeout(timer);
  }, [measureMetrics, canAutoScroll, activeFilterKey]);

  // Update metrics on resize
  useEffect(() => {
    const metrics = measureMetrics();
    if (metrics) {
      setMetricsRef.current = metrics;
    }
  }, [measureMetrics, windowWidth]);

  // Continuous auto-scrolling loop
  useEffect(() => {
    if (!canAutoScroll) return;

    const loop = (timestamp: number) => {
      if (lastTimestampRef.current === null) {
        lastTimestampRef.current = timestamp;
      }
      const elapsed = timestamp - lastTimestampRef.current;
      lastTimestampRef.current = timestamp;

      const delta = Math.min(elapsed, 100);

      if (isAutoScrollingRef.current && scrollRef.current && setMetricsRef.current) {
        const { setWidth } = setMetricsRef.current;
        if (setWidth > 0) {
          const move = (speed * delta) / 16.67;
          scrollRef.current.scrollLeft += move;

          if (scrollRef.current.scrollLeft >= 2 * setWidth) {
            scrollRef.current.scrollLeft -= setWidth;
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [canAutoScroll, speed]);

  // Throttled scroll listener
  const handleScroll = useCallback(() => {
    const now = Date.now();
    if (now - scrollThrottleRef.current < 100) return;
    scrollThrottleRef.current = now;

    if (!scrollRef.current || !setMetricsRef.current || !canAutoScroll) return;
    const { setWidth, step } = setMetricsRef.current;
    if (setWidth === 0 || step === 0) return;

    const current = scrollRef.current.scrollLeft;
    const normalized = ((current % setWidth) + setWidth) % setWidth;
    const newIndex = Math.min(
      itemsCount - 1,
      Math.max(0, Math.round(normalized / step) % itemsCount)
    );

    setActiveIndex((prev) => (prev !== newIndex ? newIndex : prev));
  }, [canAutoScroll, itemsCount]);

  // Manual Prev Navigation
  const handlePrev = useCallback(() => {
    if (!scrollRef.current || !canAutoScroll) return;
    const metrics = setMetricsRef.current || measureMetrics();
    if (!metrics) return;

    setIsInteracting(true);
    if (interactionTimerRef.current) clearTimeout(interactionTimerRef.current);

    if (scrollRef.current.scrollLeft < metrics.setWidth + metrics.step) {
      scrollRef.current.scrollLeft += metrics.setWidth;
    }

    const target = scrollRef.current.scrollLeft - metrics.step;
    scrollRef.current.scrollTo({
      left: target,
      behavior: "smooth",
    });

    interactionTimerRef.current = setTimeout(() => {
      if (scrollRef.current && metrics) {
        if (scrollRef.current.scrollLeft < metrics.setWidth) {
          scrollRef.current.scrollLeft += metrics.setWidth;
        }
      }
      setIsInteracting(false);
    }, 800);
  }, [canAutoScroll, measureMetrics]);

  // Manual Next Navigation
  const handleNext = useCallback(() => {
    if (!scrollRef.current || !canAutoScroll) return;
    const metrics = setMetricsRef.current || measureMetrics();
    if (!metrics) return;

    setIsInteracting(true);
    if (interactionTimerRef.current) clearTimeout(interactionTimerRef.current);

    const target = scrollRef.current.scrollLeft + metrics.step;
    scrollRef.current.scrollTo({
      left: target,
      behavior: "smooth",
    });

    interactionTimerRef.current = setTimeout(() => {
      if (scrollRef.current && metrics) {
        if (scrollRef.current.scrollLeft >= 2 * metrics.setWidth) {
          scrollRef.current.scrollLeft -= metrics.setWidth;
        }
      }
      setIsInteracting(false);
    }, 800);
  }, [canAutoScroll, measureMetrics]);

  // Go to index via dot
  const handleGoTo = useCallback(
    (index: number) => {
      if (!scrollRef.current || !canAutoScroll) return;
      const metrics = setMetricsRef.current || measureMetrics();
      if (!metrics) return;

      setIsInteracting(true);
      if (interactionTimerRef.current) clearTimeout(interactionTimerRef.current);

      const target = metrics.setWidth + index * metrics.step;
      scrollRef.current.scrollTo({
        left: target,
        behavior: "smooth",
      });

      interactionTimerRef.current = setTimeout(() => {
        setIsInteracting(false);
      }, 800);
    },
    [canAutoScroll, measureMetrics]
  );

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      } else if (e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        setIsUserPaused((prev) => !prev);
      }
    },
    [handlePrev, handleNext]
  );

  // Touch handlers
  const handleTouchStart = useCallback(() => {
    setIsInteracting(true);
    if (interactionTimerRef.current) clearTimeout(interactionTimerRef.current);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (interactionTimerRef.current) clearTimeout(interactionTimerRef.current);
    interactionTimerRef.current = setTimeout(() => {
      if (scrollRef.current && setMetricsRef.current) {
        const { setWidth } = setMetricsRef.current;
        while (scrollRef.current.scrollLeft < setWidth) {
          scrollRef.current.scrollLeft += setWidth;
        }
        while (scrollRef.current.scrollLeft >= 2 * setWidth) {
          scrollRef.current.scrollLeft -= setWidth;
        }
      }
      setIsInteracting(false);
    }, 1600);
  }, []);

  // Hover handlers
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  const toggleUserPaused = useCallback(() => {
    setIsUserPaused((prev) => !prev);
  }, []);

  return {
    sectionRef,
    scrollRef,
    visibleCount,
    activeIndex,
    isUserPaused,
    isHovered,
    isAutoScrolling,
    canAutoScroll,
    handlePrev,
    handleNext,
    handleGoTo,
    handleScroll,
    handleKeyDown,
    handleTouchStart,
    handleTouchEnd,
    handleTouchCancel: handleTouchEnd,
    handleMouseEnter,
    handleMouseLeave,
    toggleUserPaused,
  };
}
