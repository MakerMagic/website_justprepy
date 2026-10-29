import type { Metadata } from "next";
import { SubscriptionPage } from "@/modules/subscription/subscription-page";

export const metadata: Metadata = {
  title: "Subscription | JustPrepy",
  description:
    "Compare the JustPrepy Free and Pro plans for NUET preparation, or book a demo call with our team.",
};

export default function SubscriptionRoute() {
  return <SubscriptionPage />;
}
