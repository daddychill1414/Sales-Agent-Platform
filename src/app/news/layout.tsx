import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "News & Insights | OneNetworx Agent Platform",
  description: "Stay updated with the latest sales strategies, HR updates, and company announcements from OneNetworx. Expert tips for independent sales agents.",
};

export default function NewsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
