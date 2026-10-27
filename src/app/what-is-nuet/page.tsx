import type { Metadata } from "next";
import { NuetPage } from "@/modules/nuet/nuet-page";

export const metadata: Metadata = {
  title: "What is NUET? | Justprepy",
  description:
    "What NUET is, its exam format, subject specifications and preparation options.",
};

export default function NuetRoute() {
  return <NuetPage />;
}
