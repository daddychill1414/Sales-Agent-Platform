import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Careers | OneNetworx Agent Platform",
  description: "Join OneNetworx as an independent sales agent. Enjoy flexible schedules, uncapped commissions, and a proven path to sales career growth.",
};

export default function CareersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
