import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Agent Portal Login | OneNetworx",
  description: "Secure login to the OneNetworx Agent Portal. Access your sales dashboard, exams, and career progression tools.",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
