import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StudyBrain — AI Study Knowledge Base",
  description:
    "Upload your study materials and chat with AI to master any subject. StudyBrain remembers everything across sessions.",
  keywords: ["AI study", "knowledge base", "Claude AI", "study assistant"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:ital,wght@0,300;0,400;0,500;0,700;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="h-full bg-[#0e0f11] text-[#f0f2f5] font-syne antialiased">
        <div className="flex h-full w-full">{children}</div>
      </body>
    </html>
  );
}
