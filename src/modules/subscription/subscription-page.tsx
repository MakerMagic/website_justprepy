"use client";

import { useState } from "react";
import { PublicSiteShell } from "../../components/public-site-shell";
import { subscriptionFontVariable } from "./subscription-modal";
import { renderSubscriptionPlans } from "./subscription-plans";
import { DEMO_CALL_URL } from "./subscription.config";
import "./subscription-modal.css";
import "./subscription-page.css";

export function SubscriptionPage({
  demoCallUrl = DEMO_CALL_URL,
}: {
  demoCallUrl?: string;
} = {}) {
  const [message, setMessage] = useState("");
  const bookingReady = demoCallUrl !== "";
  return (
    <PublicSiteShell page="subscription">
      <main
        id="subscription-main"
        tabIndex={-1}
        className={"subscription-page " + subscriptionFontVariable}
      >
        <section className="subscription-page-intro">
          <h1>Choose your plan</h1>
          <p>Prepare for NUET with justprepy.</p>
        </section>
        {renderSubscriptionPlans({
          idPrefix: "subscription-page",
          message,
          onSubscribe: () => setMessage("Checkout is not connected yet."),
        })}
        <section
          className="subscription-demo"
          aria-labelledby="subscription-demo-title"
        >
          <h2 id="subscription-demo-title">Not sure yet?</h2>
          <div className="subscription-demo-copy">
            <p>
              Book a demo call with our team to see exactly what justprepy Pro
              includes and how it can help you prepare for NUET.
            </p>
            <a
              className="subscription-demo-button"
              href={bookingReady ? demoCallUrl : undefined}
              aria-disabled={bookingReady ? undefined : true}
              data-demo-call
            >
              Book a Demo Call
            </a>
            {!bookingReady && (
              <p className="subscription-demo-note" role="status">
                Demo call booking is not open yet.
              </p>
            )}
          </div>
        </section>
      </main>
    </PublicSiteShell>
  );
}
