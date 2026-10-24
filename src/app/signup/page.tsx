import type { Metadata } from "next";
import { AuthScreen } from "@/modules/auth/auth-screen";

export const metadata: Metadata = {
  title: "Get Started | JustPrepy",
  description: "Start your NUET preparation with JustPrepy.",
};

export default function SignupPage() {
  return <AuthScreen mode="signup" />;
}
