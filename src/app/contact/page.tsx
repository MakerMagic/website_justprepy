import type { Metadata } from "next";
import { ContactPage } from "@/modules/contact/contact-page";

export const metadata: Metadata = {
  title: "Contact Us | JustPrepy",
  description:
    "Contact the JustPrepy developers with questions, bug reports, feedback or collaboration proposals.",
};

export default function ContactRoute() {
  return <ContactPage />;
}
