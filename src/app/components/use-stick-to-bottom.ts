"use client";

import { useCallback, useEffect, useRef } from "react";

const NEAR_BOTTOM_PX = 48;

function atBottom() {
  return window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - NEAR_BOTTOM_PX;
}

// Follows streaming content while the visitor is at the bottom of the page. Scrolling up at all
// releases it (our own scrolls only ever move down); returning to the bottom re-pins.
export function useStickToBottom<T extends HTMLElement>() {
  const contentRef = useRef<T>(null);
  const pinned = useRef(true);

  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (y < lastY - 1) pinned.current = false;
      else if (atBottom()) pinned.current = true;
      lastY = y;
    };
    const observer = new ResizeObserver(() => {
      if (pinned.current) window.scrollTo({ top: document.documentElement.scrollHeight });
    });
    if (contentRef.current) observer.observe(contentRef.current);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // Called when the visitor sends: always bring the new turn into view.
  const pin = useCallback(() => {
    pinned.current = true;
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    requestAnimationFrame(() =>
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: smooth ? "smooth" : "auto" }),
    );
  }, []);

  return { contentRef, pin };
}
