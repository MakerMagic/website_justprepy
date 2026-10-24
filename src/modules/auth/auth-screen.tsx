import Image from "next/image";
import Link from "next/link";
import { AuthForm } from "./auth-form";
import type { AuthMode } from "./auth-validation";
import "./auth.css";

export function AuthScreen({ mode }: { mode: AuthMode }) {
  return (
    <main className="auth-page">
      <div className={`auth-shell auth-shell--${mode}`}>
        <section className="auth-main" aria-labelledby="auth-title">
          <header className="auth-header">
            <Link className="auth-brand" href="/" aria-label="JustPrepy home">
              <Image
                src="/brand/justprepy-logo.png"
                width={347}
                height={86}
                alt="JustPrepy"
                priority
              />
            </Link>
            <nav className="auth-switch" aria-label="Account access">
              <Link
                href="/login"
                aria-current={mode === "login" ? "page" : undefined}
              >
                Log In
              </Link>
              <Link
                href="/signup"
                aria-current={mode === "signup" ? "page" : undefined}
              >
                Get Started
              </Link>
            </nav>
          </header>
          <div className="auth-content">
            <div className="auth-intro">
              <h1 id="auth-title">
                {mode === "login" ? "Log In" : "Get started"}
              </h1>
              <p>
                {mode === "login"
                  ? "Enter your credentials to access your NUET question banks, mock tests, and progress."
                  : "Create your account to access curated NUET question banks and mock tests."}
              </p>
            </div>
            <AuthForm key={mode} mode={mode} />
          </div>
        </section>
        <aside className="auth-visual" aria-label="Daily inspiration">
          <Image
            className="auth-landscape"
            src="/images/auth-landscape.svg"
            fill
            sizes="(max-width: 700px) 1px, (max-width: 1160px) 46vw, 510px"
            alt=""
            priority
          />
          <span className="auth-admissions">
            <span aria-hidden="true" />
            2026/2027 Admissions
          </span>
          <figure className="auth-quote">
            <figcaption>
              <span aria-hidden="true">“</span> Daily inspiration
            </figcaption>
            <blockquote>
              “Не растрачивайте силы на low-return stuff — concentrate them on
              major deeds”
            </blockquote>
            <div className="auth-quote-footer">
              <span>— Diyar</span>
              <span className="auth-quote-stars" aria-hidden="true">
                {[0, 1, 2, 3, 4].map((star) => (
                  <svg key={star} viewBox="0 0 12 12" focusable="false">
                    <path d="m6 0 1.5 3.9 4.2.2-3.3 2.6 1.2 4.1L6 8.5l-3.6 2.3 1.2-4.1L.3 4.1l4.2-.2L6 0Z" />
                  </svg>
                ))}
              </span>
            </div>
          </figure>
        </aside>
      </div>
    </main>
  );
}
