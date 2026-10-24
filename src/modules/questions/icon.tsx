import type { ReactNode } from "react";
const paths: Record<string, ReactNode> = {
  book: (
    <>
      <path d="M4 4h6a3 3 0 0 1 3 3v14a4 4 0 0 0-4-3H4z" />
      <path d="M13 7a3 3 0 0 1 3-3h5v14h-4a4 4 0 0 0-4 3" />
    </>
  ),
  test: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M9 8h6M9 12h6M9 16h3" />
    </>
  ),
  chart: (
    <>
      <path d="M4 20h17M7 16v-5M12 16V5M17 16V8" />
    </>
  ),
  help: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9a2.5 2.5 0 0 1 5 .5c0 2-2.5 2-2.5 4M12 17h.01" />
    </>
  ),
  earn: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M15 8h-4a2 2 0 0 0 0 4h2a2 2 0 0 1 0 4H9M12 6v12" />
    </>
  ),
  bookmark: <path d="M6 3h12v18l-6-4-6 4z" />,
  check: <path d="m5 12 4 4L19 6" />,
  partial: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v6M12 17h.01" />
    </>
  ),
  cross: <path d="m7 7 10 10M17 7 7 17" />,
  chevron: <path d="m9 5 7 7-7 7" />,
  down: <path d="m6 9 6 6 6-6" />,
  play: <path d="m8 5 11 7-11 7z" fill="currentColor" stroke="none" />,
  filter: (
    <>
      <path d="M4 5h16l-6 7v7l-4-2v-5z" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M7 3v5M17 3v5M3 11h18" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a18 18 0 0 1 0 18 18 18 0 0 1 0-18" />
    </>
  ),
  settings: (
    <>
      <path
        d="m9 3-.5 3-2 1L4 6 2 10l2.5 2v2L2 16l2 4 2.5-1 2 1 .5 3h5l.5-3 2-1 2.5 1 2-4-2.5-2v-2L22 10l-2-4-2.5 1-2-1-.5-3z"
        transform="translate(0 -1) scale(.96)"
      />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  card: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="M3 10h18M7 15h3" />
    </>
  ),
  logout: (
    <>
      <path d="M10 4H5v16h5M10 12h11m-4-4 4 4-4 4" />
    </>
  ),
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
  community: (
    <>
      <path d="m3 11 18-7-5 17-5-7-8-3zM11 14l6-6" />
    </>
  ),
};
export function Icon({ name, size = 20 }: { name: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] ?? paths.book}
    </svg>
  );
}
