"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AuthIcon } from "../modules/auth/auth-icon";
import { PublicChannelIcon } from "./public-channel-icon";
import {
  contactChannels,
  contactNotices,
  type ContactNotice,
} from "../modules/contact/contact.config";
import "../modules/questions/question-bank.css";
import "../modules/contact/contact.css";

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

export function PublicSiteShell({
  children,
  page,
}: {
  children: ReactNode;
  page: "contact" | "nuet";
}) {
  const isContact = page === "contact";
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
      <a
        className="skip-link"
        href={isContact ? "#contact-main" : "#nuet-main"}
      >
        {isContact ? "Skip to contact information" : "Skip to NUET information"}
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
              aria-current={isContact ? "page" : undefined}
            >
              Contact Us
            </Link>
          </nav>
          <ContactBrand priority />
          <div className="contact-account-actions">
            <Link href="/login" className="button primary">
              Log In
            </Link>
            {preview("subscription", "Subscribe", "button accent")}
          </div>
        </div>
      </header>

      {children}

      <footer className="contact-footer">
        <div className="contact-footer-inner">
          <div className="contact-footer-grid">
            <div className="contact-footer-brand">
              <ContactBrand />
              <p>Unofficial NUET preparation platform.</p>
              <div className="contact-footer-socials">
                {contactChannels
                  .filter((channel) => channel.id !== "email")
                  .map((channel) => (
                    <a
                      key={channel.id}
                      className="contact-footer-social-link"
                      href={channel.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`JustPrepy on ${channel.id === "telegram" ? "Telegram" : "TikTok"}`}
                    >
                      {channel.id === "telegram" ? (
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path d="M21.9 4.3 18.8 19c-.2 1-.9 1.3-1.7.8l-4.8-3.5-2.3 2.2c-.3.3-.5.5-1 .5l.3-4.9 8.9-8c.4-.3-.1-.5-.6-.2L6.5 13 1.7 11.5c-1-.3-1-1 .2-1.5L20.6 2.9c.9-.3 1.6.2 1.3 1.4Z" />
                        </svg>
                      ) : (
                        <PublicChannelIcon name={channel.id} />
                      )}
                    </a>
                  ))}
              </div>
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
              <Link
                href="/what-is-nuet"
                aria-current={!isContact ? "page" : undefined}
              >
                What is NUET
              </Link>
              <Link
                href="/contact"
                aria-current={isContact ? "page" : undefined}
              >
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
          {isContact ? "Back to Contact Us" : "Back to What is NUET?"}
        </button>
      </dialog>
    </div>
  );
}
