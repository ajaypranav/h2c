import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import Providers from "@/components/Providers";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "SmartLearner — Learn Anything. Remember Everything.",
    template: "%s | SmartLearner",
  },
  description:
    "AI-powered learning retention platform. Transform notes into gamified study plans using spaced repetition science. Learn anything, remember everything.",
  keywords: [
    "learning",
    "spaced repetition",
    "flashcards",
    "AI",
    "study",
    "education",
    "retention",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plusJakarta.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
