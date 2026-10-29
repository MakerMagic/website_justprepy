"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import type { QuestionBankData } from "./question-bank.types";
import { Sidebar } from "./sidebar";
import { Popover } from "./popover";
import { Icon } from "./icon";
import "./question-bank.css";

export function PracticeShell({
  profile,
  telegramUrl = "https://t.me/justprepy",
  children,
  skipLabel = "Skip to question bank",
}: {
  profile: QuestionBankData["profile"];
  telegramUrl: string | null;
  children: ReactNode;
  skipLabel?: string;
}) {
  const resolvedTelegramUrl = telegramUrl ?? "https://t.me/justprepy";
  const telegramLabel = (
    <>
      <Icon name="community" size={18} />
      <span>Join Our Telegram Channel</span>
      <Icon name="arrow" size={15} />
    </>
  );
  return (
    <div className="question-bank-app">
      <a className="skip-link" href="#main-content">
        {skipLabel}
      </a>
      <Sidebar profile={profile} />
      <div className="workspace">
        <header className="workspace-header">
          <div className="header-context">
            <Image
              className="mobile-brand"
              src="/brand/justprepy-logo.png"
              width={347}
              height={86}
              alt="JustPrepy"
            />
            <span>NUET Preparation</span>
          </div>
          {resolvedTelegramUrl ? (
            <a
              className="telegram-cta"
              href={resolvedTelegramUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {telegramLabel}
            </a>
          ) : (
            <Popover
              id="telegram-notice"
              title="Telegram"
              className="telegram-popover"
              triggerClassName="telegram-cta"
              trigger={telegramLabel}
            >
              <p className="telegram-note">
                The Telegram channel link has not been provided yet.
              </p>
            </Popover>
          )}
        </header>
        {children}
      </div>
    </div>
  );
}
