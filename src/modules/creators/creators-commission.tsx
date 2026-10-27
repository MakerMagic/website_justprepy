"use client";

import { useEffect, useRef, useState } from "react";

const commissions = [
  {
    label: "Your code",
    value: "20%",
    description:
      "Commission on every subscription purchased with your personal promo code.",
  },
  {
    label: "Creators you recruit",
    value: "10%",
    description:
      "Commission on subscriptions bought with the promo codes of creators you recruited into the program.",
  },
] as const;

export function CreatorsCommission() {
  const [selected, setSelected] = useState(0);
  const [displayed, setDisplayed] = useState(0);
  const [swapping, setSwapping] = useState(false);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const timers = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach(clearTimeout);
      pending.clear();
    };
  }, []);

  function select(index: number, focus = false) {
    setSelected(index);
    if (focus) tabs.current[index]?.focus();
    setSwapping(true);
    // Match the source: start its 250ms CSS transition, then replace at 180ms.
    const timer = setTimeout(() => {
      setDisplayed(index);
      setSwapping(false);
      timers.current.delete(timer);
    }, 180);
    timers.current.add(timer);
  }

  const commission = commissions[displayed];
  return (
    <section className="money" id="earn">
      <div className="w mg">
        <div>
          <h2>Your code earns. So does your team.</h2>
          <p className="s">
            Every creator gets a personal promo code. Switch below to see how
            each commission works.
          </p>
          <div className="tabs" role="tablist" aria-label="Commission type">
            {commissions.map(({ label }, index) => (
              <button
                key={label}
                ref={(element) => {
                  tabs.current[index] = element;
                }}
                type="button"
                role="tab"
                id={`t${index + 1}`}
                aria-selected={selected === index}
                aria-controls="fig"
                data-k={index}
                tabIndex={selected === index ? 0 : -1}
                onClick={() => select(index)}
                onKeyDown={(event) => {
                  if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
                    event.preventDefault();
                    select(1 - index, true);
                  }
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="note">
            Earnings depend on results and are not guaranteed. Payouts follow
            program conditions shared when you join.
          </p>
        </div>
        <div
          className={swapping ? "fig sw" : "fig"}
          id="fig"
          role="tabpanel"
          aria-labelledby={`t${selected + 1}`}
          aria-live="polite"
        >
          <div className="n" id="n">
            {commission.value}
          </div>
          <p id="d">{commission.description}</p>
        </div>
      </div>
    </section>
  );
}
