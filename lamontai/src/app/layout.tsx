import type { Metadata } from "next";
import { Inter } from "next/font/google";
// Import CSS in correct order
import "./reset.css";
import "./globals.css";
import RootClientWrapper from "@/components/RootClientWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LamontAI - The #1 Ranked AI Writer for SEO Content",
  description: "Create high-quality, SEO-optimized content in minutes with our advanced AI writing assistant. Generate articles that rank and convert.",
  keywords: "AI writer, SEO content, content generation, AI content writer, SEO optimization",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full scroll-smooth antialiased" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" type="image/x-icon" sizes="16x16" />
      </head>
      <body className={`${inter.className} min-h-screen bg-white`} suppressHydrationWarning>
        <RootClientWrapper className="flex min-h-screen flex-col">
          {children}
        </RootClientWrapper>
      </body>
    </html>
  );
}
