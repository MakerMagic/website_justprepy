"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

/** Page-scoped source reveals; never add source classes to the public shell. */
export function observeCreatorsReveals(root: HTMLElement) {
  if (!("IntersectionObserver" in window)) return;
  const elements = root.querySelectorAll<HTMLElement>(".rv");
  let active = true;
  const observer = new window.IntersectionObserver(
    (entries) => {
      if (!active) return;
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          observer.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.12 },
  );
  elements.forEach((element, index) => {
    element.style.transitionDelay = String((index % 4) * 70) + "ms";
  });
  root.classList.add("creators-reveal-ready");
  // Commit the hidden state before observing, also after Strict Mode replay.
  let observationFrame = 0;
  const preparationFrame = window.requestAnimationFrame(() => {
    observationFrame = window.requestAnimationFrame(() => {
      elements.forEach((element) => observer.observe(element));
    });
  });
  return () => {
    active = false;
    window.cancelAnimationFrame(preparationFrame);
    window.cancelAnimationFrame(observationFrame);
    observer.disconnect();
    root.classList.remove("creators-reveal-ready");
    elements.forEach((element) => {
      element.classList.remove("in");
      element.style.removeProperty("transition-delay");
    });
  };
}

export function CreatorsMotion({
  children,
  fontClassName,
}: {
  children: ReactNode;
  fontClassName: string;
}) {
  const main = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    if (main.current) return observeCreatorsReveals(main.current);
  }, []);
  return (
    <main
      ref={main}
      id="creators-main"
      className={["creators-main", fontClassName].join(" ")}
      aria-labelledby="creators-title"
      tabIndex={-1}
    >
      {children}
    </main>
  );
}
