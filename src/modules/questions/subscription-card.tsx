"use client";
import { Icon } from "./icon";

export function SubscriptionCard({
  expanded,
  onExplore,
}: {
  expanded: boolean;
  onExplore: () => void;
}) {
  return (
    <div className="subscription-slot">
      <button
        type="button"
        className="subscription-compact"
        aria-label="Explore JustPrepy Pro"
        title="JustPrepy Pro"
        tabIndex={expanded ? -1 : 0}
        aria-hidden={expanded}
        onClick={onExplore}
      >
        <Icon name="card" size={20} />
        <span>Pro</span>
      </button>
      <div
        className="subscription-promo"
        role="group"
        aria-labelledby="subscription-title"
        aria-hidden={!expanded}
        inert={!expanded}
      >
        <span className="subscription-badge">New</span>
        <h2 id="subscription-title">Advanced Preparation</h2>
        <p>Unlimited Mock Tests and More</p>
        <button
          type="button"
          className="subscription-action"
          onClick={onExplore}
        >
          <span>Try Now</span>
          <Icon name="arrow" size={18} />
        </button>
      </div>
    </div>
  );
}
