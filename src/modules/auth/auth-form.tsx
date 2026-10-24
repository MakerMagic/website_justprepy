"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { FormEvent, MouseEvent } from "react";
import { AuthIcon, GoogleMark } from "./auth-icon";
import {
  validateAuthForm,
  type AuthErrors,
  type AuthMode,
  type AuthValues,
} from "./auth-validation";

const notices = {
  google: {
    title: "Continue with Google",
    text: "Google sign-in isn’t connected in this frontend preview. No account details have been sent or saved.",
  },
  password: {
    title: "Reset your password",
    text: "Password recovery will be available when authentication is connected. This preview can’t send reset emails.",
  },
  terms: {
    title: "Terms of Service",
    text: "The Terms of Service haven’t been published yet. They must be available before account registration launches. This preview does not create an account.",
  },
  privacy: {
    title: "Privacy Policy",
    text: "The Privacy Policy hasn’t been published yet. This frontend preview does not send or store the credentials you enter.",
  },
};

const subscribeHydration = () => () => {};

function AuthField({
  name,
  label,
  placeholder,
  type = "text",
  error,
  autoComplete,
}: {
  name: "identity" | "username" | "password" | "confirmPassword";
  label: string;
  placeholder: string;
  type?: "text" | "email" | "password";
  error?: string;
  autoComplete: string;
}) {
  const [visible, setVisible] = useState(false);
  const password = type === "password";
  return (
    <div className="auth-field">
      <label htmlFor={name}>
        {label}
        <span className="auth-required" aria-hidden="true">
          {" "}
          *
        </span>
      </label>
      <div className="auth-input-wrap" data-invalid={!!error}>
        <input
          id={name}
          name={name}
          type={password && visible ? "text" : type}
          placeholder={placeholder}
          required
          autoComplete={autoComplete}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : undefined}
        />
        {password ? (
          <button
            type="button"
            className="auth-password-toggle"
            aria-label={`${visible ? "Hide" : "Show"} ${name === "confirmPassword" ? "confirm password" : "password"}`}
            aria-pressed={visible}
            onClick={() => setVisible(!visible)}
          >
            <AuthIcon name={visible ? "eye-off" : "eye"} />
          </button>
        ) : (
          <span className="auth-input-icon">
            <AuthIcon name={name === "username" ? "user" : "email"} />
          </span>
        )}
      </div>
      {error && (
        <p className="auth-field-error" id={`${name}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}

export function AuthForm({ mode }: { mode: AuthMode }) {
  const hydrated = useSyncExternalStore(
    subscribeHydration,
    () => true,
    () => false,
  );
  const signup = mode === "signup";
  const [errors, setErrors] = useState<AuthErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [notice, setNotice] = useState<keyof typeof notices | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (notice && !dialog.current?.open) dialog.current?.showModal();
  }, [notice]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const values: AuthValues = {
      identity: String(data.get("identity") ?? ""),
      username: String(data.get("username") ?? ""),
      password: String(data.get("password") ?? ""),
      confirmPassword: String(data.get("confirmPassword") ?? ""),
      agreement: data.get("agreement") === "on",
    };
    const nextErrors = validateAuthForm(mode, values);
    setErrors(nextErrors);
    setSubmitted(!Object.keys(nextErrors).length);
    const firstError = (
      [
        "identity",
        "username",
        "password",
        "confirmPassword",
        "agreement",
      ] as const
    ).find((name) => nextErrors[name]);
    if (firstError)
      form.querySelector<HTMLInputElement>(`[name="${firstError}"]`)?.focus();
  }

  function openNotice(
    event: MouseEvent<HTMLAnchorElement>,
    kind: keyof typeof notices,
  ) {
    event.preventDefault();
    setNotice(kind);
  }

  return (
    <>
      <button
        className="auth-google"
        type="button"
        onClick={() => setNotice("google")}
      >
        <GoogleMark />
        <span>Sign {signup ? "up" : "in"} with Google</span>
      </button>
      <div className="auth-divider">
        <span>Or continue with {signup ? "email" : "email or username"}</span>
      </div>
      <form
        className="auth-form"
        method="post"
        onSubmit={submit}
        noValidate
        onInput={() => {
          if (submitted) setSubmitted(false);
        }}
      >
        <div className="auth-fields">
          <AuthField
            name="identity"
            label={signup ? "Email" : "Email or Username"}
            type={signup ? "email" : "text"}
            placeholder={
              signup ? "Enter your email address" : "Email address or username"
            }
            autoComplete={signup ? "email" : "username"}
            error={errors.identity}
          />
          {signup && (
            <AuthField
              name="username"
              label="Username"
              placeholder="Choose your username"
              autoComplete="username"
              error={errors.username}
            />
          )}
          <AuthField
            name="password"
            label="Password"
            type="password"
            placeholder={
              signup ? "At least 8 characters" : "Enter your password"
            }
            autoComplete={signup ? "new-password" : "current-password"}
            error={errors.password}
          />
          {signup && (
            <AuthField
              name="confirmPassword"
              label="Confirm password"
              type="password"
              placeholder="Re-enter your password"
              autoComplete="new-password"
              error={errors.confirmPassword}
            />
          )}
        </div>
        <div className="auth-form-options">
          {signup ? (
            <label className="auth-checkbox">
              <input
                type="checkbox"
                name="agreement"
                required
                aria-invalid={!!errors.agreement}
                aria-describedby={
                  errors.agreement ? "agreement-error" : undefined
                }
              />
              <span>
                I agree to the{" "}
                <a
                  href="#terms-of-service"
                  onClick={(event) => openNotice(event, "terms")}
                >
                  Terms of Service
                </a>{" "}
                and{" "}
                <a
                  href="#privacy-policy"
                  onClick={(event) => openNotice(event, "privacy")}
                >
                  Privacy Policy
                </a>
              </span>
            </label>
          ) : (
            <>
              <label className="auth-checkbox">
                <input type="checkbox" name="remember" />
                <span>Remember me</span>
              </label>
              <a
                className="auth-text-link"
                href="#reset-password"
                onClick={(event) => openNotice(event, "password")}
              >
                Forgot password?
              </a>
            </>
          )}
        </div>
        {errors.agreement && (
          <p className="auth-field-error" id="agreement-error">
            {errors.agreement}
          </p>
        )}
        <button className="auth-submit" type="submit" disabled={!hydrated}>
          <span>{signup ? "Get Started" : "Log In"}</span>
          <AuthIcon name="arrow" />
        </button>
        <p className="auth-feedback" role="status" aria-live="polite">
          {submitted
            ? `This preview doesn’t ${signup ? "create accounts" : "sign you in"} yet. Your details haven’t been sent or saved.`
            : ""}
        </p>
      </form>
      <noscript>
        <p className="auth-field-error">
          Enable JavaScript to use this frontend preview. Authentication is not
          connected.
        </p>
      </noscript>
      <p className="auth-footer">
        {signup ? "Already have an account?" : "Don’t have an account?"}{" "}
        <Link href={signup ? "/login" : "/signup"}>
          {signup ? "Log In" : "Get Started"}
        </Link>
      </p>
      <dialog
        className="auth-notice"
        ref={dialog}
        aria-labelledby="auth-notice-title"
        onClose={() => setNotice(null)}
        onClick={(event) => {
          if (event.target === dialog.current) dialog.current?.close();
        }}
      >
        <div className="auth-notice-heading">
          <h2 id="auth-notice-title">{notice ? notices[notice].title : ""}</h2>
          <button
            type="button"
            className="auth-notice-close"
            aria-label="Close notice"
            onClick={() => dialog.current?.close()}
          >
            <AuthIcon name="close" />
          </button>
        </div>
        <p>{notice ? notices[notice].text : ""}</p>
        <button
          type="button"
          className="auth-submit"
          onClick={() => dialog.current?.close()}
        >
          Back to {signup ? "Get Started" : "Log In"}
        </button>
      </dialog>
    </>
  );
}
