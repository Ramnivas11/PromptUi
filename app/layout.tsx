import type { Metadata, Viewport } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({ subsets: ["latin"], variable: '--font-playfair' });
const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });

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
      <body className={`${inter.variable} ${playfair.variable} font-sans bg-background text-foreground`}>
        <div 
          className="fixed inset-0 pointer-events-none z-50 opacity-[0.02]" 
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
        ></div>
        {children}
      </body>
    </html>
  );
}
