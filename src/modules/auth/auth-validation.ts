export type AuthMode = "login" | "signup";
export type AuthValues = {
  identity: string;
  username: string;
  password: string;
  confirmPassword: string;
  agreement: boolean;
};
export type AuthErrors = Partial<Record<keyof AuthValues, string>>;

// Preview validation only. The future authentication service owns account rules.
export function validateAuthForm(
  mode: AuthMode,
  values: AuthValues,
): AuthErrors {
  const errors: AuthErrors = {};
  if (!values.identity.trim())
    errors.identity =
      mode === "login"
        ? "Enter your email or username."
        : "Enter your email address.";
  else if (
    mode === "signup" &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.identity.trim())
  )
    errors.identity = "Enter a valid email address.";
  if (!values.password) errors.password = "Enter your password.";
  if (mode === "signup") {
    if (!values.username.trim()) errors.username = "Choose a username.";
    if (values.password && values.password.length < 8)
      errors.password = "Use at least 8 characters.";
    if (!values.confirmPassword)
      errors.confirmPassword = "Confirm your password.";
    else if (values.password !== values.confirmPassword)
      errors.confirmPassword = "Your passwords don’t match.";
    if (!values.agreement)
      errors.agreement =
        "Please agree to the Terms of Service and Privacy Policy.";
  }
  return errors;
}
