"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

/** Keep the reference sequence one-shot and wait for its hidden state to paint. */
export function observeNuetReveals(root: HTMLElement) {
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
  root.classList.add("nuet-reveal-ready");

  // Hydration (including Strict Mode replay) must commit the starting styles
  // before the observer can switch visible elements to their final state.
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
    root.classList.remove("nuet-reveal-ready");
    elements.forEach((element) => {
      element.classList.remove("in");
      element.style.removeProperty("transition-delay");
    });
  };
}

export function NuetReveal({
  children,
  fontClassName,
}: {
  children: ReactNode;
  fontClassName: string;
}) {
  const main = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    if (main.current) return observeNuetReveals(main.current);
  }, []);

  return (
    <main
      ref={main}
      id="nuet-main"
      className={["nuet-main", fontClassName].join(" ")}
      aria-labelledby="nuet-title"
      tabIndex={-1}
    >
      {children}
    </main>
  );
}
