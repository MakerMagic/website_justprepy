import type { AnchorRect } from "./popover-position";

/** FLIP from the real profile rectangle into its already-positioned menu. */
export function accountDisclosureOrigin(anchor: AnchorRect, panel: AnchorRect) {
  const width = panel.right - panel.left,
    height = panel.bottom - panel.top;
  if (width <= 0 || height <= 0) return "none";
  return `translate(${anchor.left - panel.left}px, ${anchor.top - panel.top}px) scale(${(anchor.right - anchor.left) / width}, ${(anchor.bottom - anchor.top) / height})`;
}

/** Four semantic stages; elements in the same stage always reveal together. */
export const accountDisclosureStages = [
  ".popover-heading, .account-summary",
  ".account-actions > button:nth-child(1)",
  ".account-actions > button:nth-child(2)",
  ".account-actions > button:nth-child(3), .unavailable-note",
] as const;

export function accountDisclosureTiming(
  stage: number,
  opening: boolean,
  duration: number,
) {
  return {
    duration: opening ? duration * 0.6 : duration * 0.25,
    delay: opening ? duration * 0.1 + stage * 80 : (3 - stage) * 25,
  };
}

export function animateAccountDisclosure(
  panel: HTMLElement,
  trigger: HTMLElement,
  opening: boolean,
  previous: Animation[],
) {
  const currentTransform = getComputedStyle(panel).transform;
  const currentOpacity = getComputedStyle(panel).opacity;
  const rows = accountDisclosureStages.flatMap((selector, stage) =>
    [...panel.querySelectorAll<HTMLElement>(selector)].map((element) => ({
      element,
      stage,
      state: {
        opacity: getComputedStyle(element).opacity,
        transform: getComputedStyle(element).transform,
      },
    })),
  );
  previous.forEach((animation) => animation.cancel());
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return [];
  const styles = getComputedStyle(panel);
  const duration = parseFloat(styles.getPropertyValue("--motion-disclosure"));
  const easing = styles.getPropertyValue("--ease-disclosure").trim();
  const compactRadius = getComputedStyle(trigger).borderRadius,
    expandedRadius = styles.borderRadius;
  const rect = {
    left: panel.offsetLeft,
    top: panel.offsetTop,
    right: panel.offsetLeft + panel.offsetWidth,
    bottom: panel.offsetTop + panel.offsetHeight,
  };
  const origin = accountDisclosureOrigin(trigger.getBoundingClientRect(), rect);
  const surface = panel.animate(
    opening
      ? [
          { transform: origin, opacity: 0.15, borderRadius: compactRadius },
          { transform: "none", opacity: 1, borderRadius: expandedRadius },
        ]
      : [
          { transform: currentTransform, opacity: currentOpacity, offset: 0 },
          {
            transform: currentTransform,
            opacity: currentOpacity,
            offset: 0.15,
          },
          { transform: origin, opacity: 0, borderRadius: compactRadius },
        ],
    { duration: duration * (opening ? 0.75 : 0.65), easing, fill: "both" },
  );
  const content = rows.map(({ element, stage, state }) =>
    element.animate(
      opening
        ? [
            { opacity: 0, transform: "translateY(8px)" },
            { opacity: 1, transform: "none" },
          ]
        : [state, { opacity: 0, transform: "translateY(4px)" }],
      {
        ...accountDisclosureTiming(stage, opening, duration),
        easing,
        fill: "both",
      },
    ),
  );
  return [surface, ...content];
}
