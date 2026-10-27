import { Inter } from "next/font/google";
import { PublicSiteShell } from "../../components/public-site-shell";
import { contactChannels } from "../contact/contact.config";
import { CreatorsCommission } from "./creators-commission";
import { CreatorsMotion } from "./creators-motion";
import "./creators.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-creators",
});

function ApplicationLink({
  applicationUrl,
  className,
  live = false,
}: {
  applicationUrl: string;
  className: string;
  live?: boolean;
}) {
  return (
    <a
      className={className}
      data-apply
      data-live={live || undefined}
      href={applicationUrl || "#apply"}
      target={applicationUrl ? "_blank" : undefined}
      rel={applicationUrl ? "noopener" : undefined}
    >
      Apply for Creator Program
    </a>
  );
}

function CreatorsHero({ applicationUrl }: { applicationUrl: string }) {
  return (
    <section className="hero">
      <div className="w hg">
        <div>
          <h1 id="creators-title">Get paid to make NUET content.</h1>
          <p className="s rv">
            Join the justprepy UGC Creator Program: post short videos on TikTok,
            Instagram or YouTube Shorts that introduce NUET applicants to
            justprepy, and earn commission on subscriptions bought with your
            personal promo code.
          </p>
          <div className="cta rv">
            <ApplicationLink
              applicationUrl={applicationUrl}
              className="btn bg big"
            />
          </div>
        </div>
        <div className="ph rv" aria-hidden="true">
          <div className="scr">
            <div className="top">justprepy</div>
            <div>
              <div className="q">NUET prep, in 60 seconds.</div>
              <div className="code" style={{ marginTop: 16 }}>
                Use my code
              </div>
            </div>
            <div className="bar">
              <b />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CreatorsPerks() {
  return (
    <section id="perks">
      <div className="w">
        <h2>And that’s not all.</h2>
        <div className="pk">
          <div className="rv">
            <h3>Monthly bonuses</h3>
            <p>Large monthly bonuses for the creators with the best results.</p>
          </div>
          <div className="rv">
            <h3>A letter from the founders</h3>
            <p>
              High results give you the chance to earn a recommendation letter
              from the justprepy founding team.
            </p>
          </div>
          <div className="rv">
            <h3>Real experience</h3>
            <p>
              Hands-on content work that gives you real experience for your
              résumé.
            </p>
          </div>
          <div className="rv">
            <h3>A creator community</h3>
            <p>
              Access to the community of UGC creators and the justprepy team.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function CreatorsApplication({ applicationUrl }: { applicationUrl: string }) {
  const telegramHref = contactChannels.find(
    ({ id }) => id === "telegram",
  )?.href;
  return (
    <section id="apply">
      <div className="w">
        <div className="ap">
          <div>
            <h2>Ready to create?</h2>
          </div>
          <div>
            <p className={applicationUrl ? "hid" : undefined} data-open>
              Creator applications are not open on this page yet. Follow the
              justprepy Telegram channel to hear when they are.
            </p>
            <a
              className={["btn bw", applicationUrl ? "hid" : ""]
                .filter(Boolean)
                .join(" ")}
              data-open
              href={telegramHref}
              target="_blank"
              rel="noopener"
            >
              Follow on Telegram
            </a>
            <p className={applicationUrl ? undefined : "hid"} data-live>
              Tell us a little about you and your content.
            </p>
            <ApplicationLink
              applicationUrl={applicationUrl}
              className={["btn bg big", applicationUrl ? "" : "hid"]
                .filter(Boolean)
                .join(" ")}
              live
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/** The source APPLY_URL is empty; keep its Telegram fallback until configured. */
export function CreatorsPage({
  applicationUrl = "",
}: {
  applicationUrl?: string;
} = {}) {
  return (
    <PublicSiteShell page="creators">
      <CreatorsMotion fontClassName={inter.variable}>
        <CreatorsHero applicationUrl={applicationUrl} />
        <CreatorsCommission />
        <CreatorsPerks />
        <CreatorsApplication applicationUrl={applicationUrl} />
      </CreatorsMotion>
    </PublicSiteShell>
  );
}
