import { createHash } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { NuetPage } from "./nuet-page";
import { observeNuetReveals } from "./nuet-reveal";
import { ContactPage } from "../contact/contact-page";

vi.mock("next/font/google", () => ({
  Inter: () => ({ variable: "nuet-font" }),
}));

function render() {
  return renderToStaticMarkup(<NuetPage />);
}
function mainContent(html: string) {
  return html.match(/<main[^>]*>([\s\S]*?)<\/main>/)![1];
}
function textOnly(html: string) {
  return html
    .replace(/<[^>]+>/g, "")
    .replaceAll("&amp;", "&")
    .replaceAll("&#x27;", "'")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replace(/\s+/g, "");
}

describe("What is NUET reference integration", () => {
  it("preserves reference content and order except the two owner-requested removals", () => {
    // Source main text, excluding only the requested note and legacy source link.
    expect(
      createHash("sha256")
        .update(textOnly(mainContent(render())))
        .digest("hex"),
    ).toBe("0e2ace8ce0fa09b9f50a4057f4054e94e3e4322aca7b01bd5652fe38998c2f0d");
  });

  it("retains section order and complete native topic disclosures closed by default", () => {
    const main = mainContent(render());
    const headings = [
      "What is NUET?",
      "One test, two ways in.",
      "The exam at a glance.",
      "What each section asks.",
      "Not sure where to prepare?",
    ];
    for (let index = 1; index < headings.length; index++) {
      expect(main.indexOf(headings[index - 1])).toBeLessThan(
        main.indexOf(headings[index]),
      );
    }
    expect(main.match(/<details\b/g)).toHaveLength(3);
    expect(main.match(/<summary\b/g)).toHaveLength(3);
    expect(main.match(/<details[^>]* open=""/g)).toBeNull();
    for (const topic of [
      "Summarising the main conclusion",
      "Drawing a conclusion",
      "Identifying an assumption",
      "Assessing additional evidence",
      "Detecting reasoning errors",
      "Matching arguments",
      "Applying principles",
      "Relevant selection",
      "Finding procedures",
      "Identifying similarity",
      "Knowledge it draws on",
      "How it differs from Critical Thinking",
      "Topic list: see the official PDF",
    ])
      expect(main).toContain(topic);
  });

  it("preserves the four retained official source URLs and removes the legacy source", () => {
    const main = mainContent(render());
    for (const href of [
      "https://cps.nu.edu.kz/admissions",
      "https://nu.edu.kz/wp-content/uploads/2026/04/admission-policy-and-procedures-to-the-nazarbayev-university-foundation-year-program-and-undergraduate-program-of-nu-1.pdf",
      "https://drive.google.com/file/d/1kU4ydcpfieJLa6bA3iHa9Z_VFOjXtE5e/view?usp=sharing",
      "https://drive.google.com/file/d/1qGvW5QoqHjiGsxfEBKPF--I7AZBjQ_m-/view?usp=sharing",
    ])
      expect(main).toContain('href="' + href + '"');
    expect(main).not.toContain("THINKING+SKILLS+SPECIFICATION.pdf");
    expect(main).not.toContain(
      "Critical Thinking and Problem Solving detail above follows",
    );
    expect(main).toContain('href="https://t.me/justprepy"');
    expect(main).toMatch(/<a[^>]*href="\/"[^>]*>Start Practicing<\/a>/);
    expect(main).not.toContain("/question-bank");
    expect(main).toContain('href="#prepare"');
    expect(main).toContain('href="#structure"');
    expect(
      main.match(/target="_blank" rel="noopener noreferrer"/g),
    ).toHaveLength(5);
  });

  it("reuses one public header and footer on both pages with correct current-page navigation", () => {
    for (const html of [render(), renderToStaticMarkup(<ContactPage />)]) {
      expect(html.match(/<header\b/g)).toHaveLength(1);
      expect(html.match(/<footer\b/g)).toHaveLength(1);
      expect(html.match(/<main\b/g)).toHaveLength(1);
      expect(html).toContain('class="contact-header"');
      expect(html).toContain('class="contact-footer"');
      expect(html).toContain('href="/what-is-nuet"');
      expect(html).toContain('aria-label="JustPrepy on Telegram"');
      expect(html).toContain('aria-label="JustPrepy on TikTok"');
      expect(html).not.toContain('class="sidebar"');
    }
    const html = render();
    expect(html).toMatch(
      /<a(?=[^>]*href="\/what-is-nuet")(?=[^>]*aria-current="page")[^>]*>What is NUET<\/a>/,
    );
    expect(html).not.toMatch(
      /<a(?=[^>]*href="\/contact")(?=[^>]*aria-current="page")/,
    );
    expect(html).toContain('href="#nuet-main"');
  });
});

function motionFixture() {
  const classList = () => {
    const values = new Set<string>();
    return {
      add: (value: string) => {
        values.add(value);
      },
      remove: (value: string) => {
        values.delete(value);
      },
      contains: (value: string) => values.has(value),
    };
  };
  const elements = Array.from({ length: 5 }, () => ({
    classList: classList(),
    style: {
      transitionDelay: "",
      removeProperty() {
        this.transitionDelay = "";
      },
    },
  }));
  const rootClasses = classList();
  const root = {
    classList: rootClasses,
    querySelectorAll: () => elements,
  } as unknown as HTMLElement;
  const observe = vi.fn();
  const unobserve = vi.fn();
  const disconnect = vi.fn();
  const constructor = vi.fn();
  let notify: IntersectionObserverCallback = () => {
    throw new Error("Observer not initialized");
  };
  class Observer {
    constructor(
      callback: IntersectionObserverCallback,
      options: IntersectionObserverInit,
    ) {
      notify = callback;
      constructor(options);
    }
    observe = observe;
    unobserve = unobserve;
    disconnect = disconnect;
  }
  let nextFrame = 0;
  const frames = new Map<number, FrameRequestCallback>();
  vi.stubGlobal("window", {
    IntersectionObserver: Observer,
    requestAnimationFrame: (callback: FrameRequestCallback) => {
      const id = ++nextFrame;
      frames.set(id, callback);
      return id;
    },
    cancelAnimationFrame: (id: number) => {
      frames.delete(id);
    },
  });
  const frame = () => {
    const pending = [...frames.values()];
    frames.clear();
    pending.forEach((callback) => callback(0));
  };
  const deliver = (index: number, isIntersecting: boolean) => {
    notify(
      [
        {
          target: elements[index],
          isIntersecting,
        } as unknown as IntersectionObserverEntry,
      ],
      {} as IntersectionObserver,
    );
  };
  return {
    root,
    rootClasses,
    elements,
    observe,
    unobserve,
    disconnect,
    constructor,
    frames,
    frame,
    deliver,
  };
}

describe("NUET reveal lifecycle", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("paints the starting state before observing and keeps the reference threshold and stagger", () => {
    const fixture = motionFixture();
    const stop = observeNuetReveals(fixture.root);
    expect(fixture.rootClasses.contains("nuet-reveal-ready")).toBe(true);
    expect(
      fixture.elements.map((element) => element.style.transitionDelay),
    ).toEqual(["0ms", "70ms", "140ms", "210ms", "0ms"]);
    expect(fixture.constructor).toHaveBeenCalledWith({ threshold: 0.12 });
    expect(fixture.observe).not.toHaveBeenCalled();
    fixture.frame();
    expect(fixture.observe).not.toHaveBeenCalled();
    fixture.frame();
    expect(fixture.observe.mock.calls.map(([target]) => target)).toEqual(
      fixture.elements,
    );
    stop?.();
  });

  it("reveals only intersecting elements and stops observing each revealed element", () => {
    const fixture = motionFixture();
    const stop = observeNuetReveals(fixture.root);
    fixture.frame();
    fixture.frame();
    fixture.deliver(0, false);
    expect(fixture.elements[0].classList.contains("in")).toBe(false);
    expect(fixture.unobserve).not.toHaveBeenCalled();
    fixture.deliver(1, true);
    expect(fixture.elements[1].classList.contains("in")).toBe(true);
    expect(fixture.unobserve).toHaveBeenCalledExactlyOnceWith(
      fixture.elements[1],
    );
    stop?.();
  });

  it.each([0, 1])(
    "cancels pending observation when unmounted after %i preparation frames",
    (completedFrames) => {
      const fixture = motionFixture();
      const stop = observeNuetReveals(fixture.root);
      for (let i = 0; i < completedFrames; i++) fixture.frame();
      stop?.();
      fixture.frame();
      fixture.frame();
      expect(fixture.frames.size).toBe(0);
      expect(fixture.observe).not.toHaveBeenCalled();
      expect(fixture.disconnect).toHaveBeenCalledOnce();
      expect(fixture.rootClasses.contains("nuet-reveal-ready")).toBe(false);
    },
  );

  it("cleans up revealed state and ignores stale notifications during Strict Mode replay", () => {
    const fixture = motionFixture();
    const stop = observeNuetReveals(fixture.root);
    fixture.frame();
    fixture.frame();
    fixture.deliver(0, true);
    stop?.();
    fixture.deliver(1, true);
    expect(
      fixture.elements.every(
        (element) =>
          !element.classList.contains("in") &&
          element.style.transitionDelay === "",
      ),
    ).toBe(true);
    expect(fixture.rootClasses.contains("nuet-reveal-ready")).toBe(false);
    const stopReplay = observeNuetReveals(fixture.root);
    expect(fixture.frames.size).toBe(1);
    expect(
      fixture.elements.every((element) => !element.classList.contains("in")),
    ).toBe(true);
    fixture.frame();
    fixture.frame();
    fixture.deliver(0, true);
    expect(fixture.elements[0].classList.contains("in")).toBe(true);
    stopReplay?.();
  });

  it("keeps content visible without IntersectionObserver", () => {
    const fixture = motionFixture();
    vi.stubGlobal("window", {});
    expect(observeNuetReveals(fixture.root)).toBeUndefined();
    expect(fixture.rootClasses.contains("nuet-reveal-ready")).toBe(false);
    expect(fixture.frames.size).toBe(0);
  });
});
