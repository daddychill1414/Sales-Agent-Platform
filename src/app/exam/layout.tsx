import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Assessment | OneNetworx Agent Platform",
  description: "Complete your sales assessment exam to progress in the OneNetworx recruitment pipeline. Situational judgement and skills evaluation.",
};

export default function ExamLayout({ children }: { children: React.ReactNode }) {
  return children;
}
