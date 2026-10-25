export const contactChannels = [
  {
    id: "email",
    title: "Direct Email",
    handle: "buildsierem@gmail.com",
    href: "mailto:buildsierem@gmail.com",
    description:
      "Have specific inquiries, bug reports, or partnership proposals? Write directly to our engineering team and get a quick reply.",
    action: "Send Email",
    external: false,
  },
  {
    id: "telegram",
    title: "Telegram Channel",
    handle: "@justprepy",
    href: "https://t.me/justprepy",
    description:
      "Useful posts on scores required for admissions, exclusive events, insights, and tutorials directly from the creator team.",
    action: "Join Channel",
    external: true,
  },
  {
    id: "tiktok",
    title: "TikTok Community",
    handle: "@justprepy_",
    href: "https://www.tiktok.com/@justprepy_",
    description:
      "Diverse content featuring admission scores, student tips, memes, and platform updates.",
    action: "Follow on TikTok",
    external: true,
  },
] as const;

export const contactNotices = {
  features: {
    title: "Features",
    text: "The public features page is not available yet. Explore the current Question Bank and Mock Tests previews through Practice.",
  },
  subscription: {
    title: "Subscription",
    text: "Subscription options are not available in this frontend preview. No purchase or payment is made here.",
  },
  earn: {
    title: "Earn money",
    text: "The Earn Money programme is not available yet. Contact the developers by email for collaboration inquiries.",
  },
  nuet: {
    title: "What is NUET",
    text: "The NUET information page has not been published yet. The development team can be reached through the contact channels on this page.",
  },
  privacy: {
    title: "Privacy Policy",
    text: "The Privacy Policy has not been published yet. This contact page does not collect form submissions. External channels have their own privacy policies.",
  },
  terms: {
    title: "Terms of service",
    text: "The Terms of Service have not been published yet. This page provides contact links and does not create an account or subscription.",
  },
} as const;

export type ContactNotice = keyof typeof contactNotices;
