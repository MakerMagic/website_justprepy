import { describe, expect, it } from "vitest";
import { validateAuthForm, type AuthValues } from "./auth-validation";

const valid: AuthValues = {
  identity: "student@example.com",
  username: "nuet_aspirant",
  password: "example-password",
  confirmPassword: "example-password",
  agreement: true,
};

describe("auth preview validation", () => {
  it("allows either an email or username for login without signup-only fields", () => {
    expect(
      validateAuthForm("login", {
        ...valid,
        identity: "nuet_aspirant",
        username: "",
        confirmPassword: "",
        agreement: false,
      }),
    ).toEqual({});
    expect(validateAuthForm("login", valid)).toEqual({});
  });
  it("rejects blank login credentials", () => {
    expect(
      validateAuthForm("login", { ...valid, identity: "   ", password: "" }),
    ).toEqual({
      identity: "Enter your email or username.",
      password: "Enter your password.",
    });
  });
  it("requires an email address and username when signing up", () => {
    const errors = validateAuthForm("signup", {
      ...valid,
      identity: "not-an-email",
      username: " ",
    });
    expect(errors.identity).toBeDefined();
    expect(errors.username).toBeDefined();
  });
  it("validates password length and confirmation independently", () => {
    const errors = validateAuthForm("signup", {
      ...valid,
      password: "short",
      confirmPassword: "different",
    });
    expect(errors.password).toBe("Use at least 8 characters.");
    expect(errors.confirmPassword).toBe("Your passwords don’t match.");
  });
  it("requires confirmation and agreement", () => {
    const errors = validateAuthForm("signup", {
      ...valid,
      confirmPassword: "",
      agreement: false,
    });
    expect(errors.confirmPassword).toBeDefined();
    expect(errors.agreement).toBeDefined();
  });
  it("accepts a complete signup form without altering password whitespace", () => {
    expect(validateAuthForm("signup", valid)).toEqual({});
    expect(
      validateAuthForm("signup", {
        ...valid,
        password: " password ",
        confirmPassword: "password",
      }).confirmPassword,
    ).toBeDefined();
  });
});
