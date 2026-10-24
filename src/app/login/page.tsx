import type { Metadata } from "next";
import { AuthScreen } from "@/modules/auth/auth-screen";

export const metadata: Metadata = {
  title: "Log In | JustPrepy",
  description: "Log in to continue your NUET preparation with JustPrepy.",
};

export default function LoginPage() {
  return <AuthScreen mode="login" />;
}
