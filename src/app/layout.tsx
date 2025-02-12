import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AuthProvider } from "@/lib/context/AuthContext";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "Westplace - Westland University Marketplace",
  description:
    "The official marketplace for Westland University students and staff. Buy and sell textbooks, electronics, furniture, and more.",
  keywords: [
    "marketplace",
    "university",
    "student",
    "westland",
    "buy",
    "sell",
    "textbooks",
    "electronics",
  ],
  authors: [{ name: "Westland University" }],
  creator: "Westland University",
  publisher: "Westland University",
  metadataBase: new URL("https://westplace.vercel.app"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://westplace.vercel.app",
    siteName: "Westplace",
    title: "Westplace - Westland University Marketplace",
    description:
      "The official marketplace for Westland University students and staff. Buy and sell textbooks, electronics, furniture, and more.",
    images: [
      {
        url: "/logo.jpg",
        width: 1200,
        height: 630,
        alt: "Westplace Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Westplace - Westland University Marketplace",
    description:
      "The official marketplace for Westland University students and staff. Buy and sell textbooks, electronics, furniture, and more.",
    images: ["/logo.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
          <Analytics />
        </AuthProvider>
      </body>
    </html>
  );
}
