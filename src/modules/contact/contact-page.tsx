"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AuthIcon } from "../auth/auth-icon";
import {
  contactChannels,
  contactNotices,
  type ContactNotice,
} from "./contact.config";
import "../questions/question-bank.css";
import "./contact.css";

function ChannelIcon({
  name,
}: {
  name: (typeof contactChannels)[number]["id"];
}) {
  if (name === "email") return <AuthIcon name="email" />;
  if (name === "telegram")
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="10" fill="currentColor" />
        <path
          d="m6.6 11.7 10.8-4.2-2 9.1-3.3-2.5-1.7 1.6.3-2.8 5.2-4.1-6.5 3.5z"
          fill="white"
        />
      </svg>
    );
  // Simple Icons TikTok geometry, CC0-1.0:
  // https://github.com/simple-icons/simple-icons/blob/develop/icons/tiktok.svg
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );
}

function ContactBrand({ priority = false }: { priority?: boolean }) {
  return (
    <Link href="/" className="contact-brand" aria-label="JustPrepy home">
      <Image
        src="/brand/justprepy-logo-transparent.png"
        width={351}
        height={90}
        alt="JustPrepy"
        priority={priority}
      />
    </Link>
  );
}

export function ContactPage() {
  const [notice, setNotice] = useState<ContactNotice | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (notice && !dialog.current?.open) dialog.current?.showModal();
  }, [notice]);
  const currentNotice = notice ? contactNotices[notice] : null;
  const preview = (key: ContactNotice, label: string, className?: string) => (
    <button type="button" className={className} onClick={() => setNotice(key)}>
      {label}
    </button>
  );

  return (
    <div className="contact-page">
      <a className="skip-link" href="#contact-main">
        Skip to contact information
      </a>
      <header className="contact-header">
        <div className="contact-header-inner">
          <nav className="contact-navigation" aria-label="Public navigation">
            <Link href="/" className="contact-nav-control">
              Practice
            </Link>
            {preview("features", "Features", "contact-nav-control")}
            <Link
              href="/contact"
              className="contact-nav-control"
              aria-current="page"
            >
              Contact Us
            </Link>
          </nav>
          <ContactBrand priority />
          <div className="contact-account-actions">
            {preview("subscription", "Subscribe", "button accent")}
            <Link href="/login" className="button primary">
              Log In
            </Link>
          </div>
        </div>
      </header>

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
                <ChannelIcon name={channel.id} />
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

      <footer className="contact-footer">
        <div className="contact-footer-inner">
          <div className="contact-footer-grid">
            <div className="contact-footer-brand">
              <ContactBrand />
              <p>Unofficial NUET preparation platform.</p>
            </div>
            <nav aria-labelledby="contact-offers-title">
              <h2 id="contact-offers-title">Offers</h2>
              <Link href="/">Question Bank</Link>
              {preview("subscription", "Subscription")}
              {preview("earn", "Earn money")}
              <Link href="/mock-tests">Mock Tests</Link>
            </nav>
            <nav aria-labelledby="contact-info-title">
              <h2 id="contact-info-title">Info</h2>
              {preview("nuet", "What is NUET")}
              <Link href="/contact" aria-current="page">
                Contact us
              </Link>
            </nav>
            <nav aria-labelledby="contact-legal-title">
              <h2 id="contact-legal-title">Legal</h2>
              {preview("privacy", "Privacy Policy")}
              {preview("terms", "Terms of service")}
            </nav>
          </div>
          <div className="contact-footer-bottom">
            <p>
              © {new Date().getUTCFullYear()} justprepy All Rights Reserved.
            </p>
            <p>
              Not affiliated with, endorsed by, or sponsored by Nazarbayev
              University
            </p>
          </div>
        </div>
      </footer>

      <dialog
        ref={dialog}
        className="contact-preview-dialog"
        aria-labelledby="contact-preview-title"
        aria-describedby="contact-preview-description"
        onClose={() => setNotice(null)}
      >
        <div className="contact-preview-heading">
          <h2 id="contact-preview-title">{currentNotice?.title}</h2>
          <button
            type="button"
            className="icon-button"
            autoFocus
            aria-label="Close preview notice"
            onClick={() => dialog.current?.close()}
          >
            <AuthIcon name="close" />
          </button>
        </div>
        <p id="contact-preview-description">{currentNotice?.text}</p>
        <button
          type="button"
          className="button primary"
          onClick={() => dialog.current?.close()}
        >
          Back to Contact Us
        </button>
      </dialog>
    </div>
  );
}
