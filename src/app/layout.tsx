import type { Metadata } from "next";
import { Inter, Cormorant_Garamond, Playfair_Display, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Footer } from "@/components/Footer";
import { ToastProvider } from "@/components/ToastProvider";
import { CustomCursor } from "@/components/CustomCursor";
import { PageTransition } from "@/components/PageTransition";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-cormorant"
});
const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-playfair"
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-jetbrains"
});

export const metadata: Metadata = {
  title: "OneNetworx Agent Platform",
  description: "Be your own boss. Discover multiple income opportunities.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className={`${inter.variable} ${cormorant.variable} ${playfair.variable} ${jetbrainsMono.variable} antialiased selection:bg-accent selection:text-black flex flex-col min-h-screen`}>
        <ToastProvider>
          <CustomCursor />
          <div className="flex-grow">
            <PageTransition>
              {children}
            </PageTransition>
          </div>
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}
