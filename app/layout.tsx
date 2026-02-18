import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
};

export const metadata: Metadata = {
  title: "PromptUI - AI Component Generator",
  description:
    "Describe any UI component and watch it build instantly — production-ready React & Tailwind.",
  icons: {
    icon: "/favicon.png",
  },
  openGraph: {
    title: "PromptUI - AI Component Generator",
    description:
      "Describe any UI component and watch it build instantly — production-ready React & Tailwind.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PromptUI - AI Component Generator",
    description:
      "Describe any UI component and watch it build instantly — production-ready React & Tailwind.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
