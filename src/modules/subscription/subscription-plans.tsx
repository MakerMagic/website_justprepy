import type { ReactNode } from "react";

const freeFeatures = [
  "Limited Mock Tests",
  "Limited Questions",
  "Constrained Vocabulary Practice",
  "Basic Analytics",
];
const proFeatures = [
  "1500+ Questions",
  "All Explanations Available",
  "Unlimited Mock Tests",
  "500+ Vocabulary Words",
  "Advanced Performance Analytics for You",
];
// The supplied implementation has no checkout destination.
const CHECKOUT_URL = "";

function PlanCheck() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill="#3DD86D" />
      <path
        d="m7 12.5 3.2 3.2L17 8.8"
        fill="none"
        stroke="#0e0e0e"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Shared Free/Pro plan cards for the pop-up and the Subscription page. Called as a
 * function (not mounted as a component) so each caller's element tree stays flat.
 */
export function renderSubscriptionPlans({
  idPrefix,
  message,
  onSubscribe,
}: {
  idPrefix: string;
  message: string;
  onSubscribe: () => void;
}): ReactNode {
  return (
    <div className="subscription-plans">
      <section
        className="subscription-plan subscription-free"
        aria-labelledby={idPrefix + "-free"}
      >
        <h3 id={idPrefix + "-free"}>Free</h3>
        <div className="subscription-price">
          0<span>₸</span>
        </div>
        <ul>
          {freeFeatures.map((feature) => (
            <li key={feature}>
              <i aria-hidden="true" />
              {feature}
            </li>
          ))}
        </ul>
        <div className="subscription-current" role="status">
          Currently using
        </div>
      </section>
      <section
        className="subscription-plan subscription-pro"
        aria-labelledby={idPrefix + "-pro"}
      >
        <h3 id={idPrefix + "-pro"}>Pro</h3>
        <div className="subscription-price">
          10,000<span>₸</span>
        </div>
        <ul>
          {proFeatures.map((feature) => (
            <li key={feature}>
              <PlanCheck />
              {feature}
            </li>
          ))}
        </ul>
        <button
          className="subscription-subscribe"
          type="button"
          data-checkout={CHECKOUT_URL}
          onClick={onSubscribe}
        >
          <span>Subscribe</span>
        </button>
        <p className="subscription-status" role="status" aria-live="polite">
          {message}
        </p>
      </section>
    </div>
  );
}
