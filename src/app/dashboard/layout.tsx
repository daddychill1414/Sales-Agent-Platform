import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Dashboard | OneNetworx Agent Platform",
  description: "Track your application progress, view assigned exams, and manage your OneNetworx agent profile.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
