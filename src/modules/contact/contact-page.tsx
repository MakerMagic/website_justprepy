import { PublicSiteShell } from "../../components/public-site-shell";
import { PublicChannelIcon } from "../../components/public-channel-icon";
import { AuthIcon } from "../auth/auth-icon";
import { contactChannels } from "./contact.config";

export function ContactPage() {
  return (
    <PublicSiteShell page="contact">
      <main id="contact-main" className="contact-main" tabIndex={-1}>
        <section className="contact-intro" aria-labelledby="contact-title">
          <span className="contact-support-label">
            <span aria-hidden="true" />
            Direct Developer Support
          </span>
          <h1 id="contact-title">Contact the Developers</h1>
          <p>
            Whether you have feedback, questions about NUET questions,
            encountered a bug, or want to collaborate, we’re here to help.
          </p>
        </section>
        <section className="contact-channels" aria-label="Contact channels">
          {contactChannels.map((channel) => (
            <article
              className={`contact-card contact-card--${channel.id}`}
              key={channel.id}
            >
              {channel.id === "telegram" && (
                <span className="contact-official">Official Channel</span>
              )}
              <span className="contact-channel-icon">
                <PublicChannelIcon name={channel.id} />
              </span>
              <h2>{channel.title}</h2>
              <p className="contact-handle">{channel.handle}</p>
              <p className="contact-card-description">{channel.description}</p>
              <div className="contact-card-action">
                <a
                  className="button primary"
                  href={channel.href}
                  target={channel.external ? "_blank" : undefined}
                  rel={channel.external ? "noopener noreferrer" : undefined}
                >
                  {channel.action}
                  <span className="contact-external-arrow" aria-hidden="true">
                    <AuthIcon name="arrow" />
                  </span>
                </a>
              </div>
            </article>
          ))}
        </section>
      </main>
    </PublicSiteShell>
  );
}
