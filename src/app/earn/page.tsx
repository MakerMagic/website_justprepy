import type { Metadata } from "next";
import { CreatorsPage } from "@/modules/creators/creators-page";

export const metadata: Metadata = {
  title: "UGC Creator Program | justprepy",
  description:
    "Join the justprepy UGC Creator Program and earn commission by making NUET content.",
};

export default function CreatorsRoute() {
  return <CreatorsPage />;
}
