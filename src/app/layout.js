import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "MJ Logistic Services | Nationwide Transport & Fleet Solutions Pakistan",
  description:
    "MJ Logistic Services provides nationwide logistics, freight transport, heavy machinery handling, and fleet solutions across Pakistan. Get instant transport estimates and reliable delivery services.",

  icons: {
    icon: "/favicon.ico",
  },

  openGraph: {
    title: "MJ Logistic Services",
    description:
      "Reliable nationwide logistics, freight, and fleet management solutions across Pakistan.",
    url: "https://www.mjlogisticservices.com",
    siteName: "MJ Logistic Services",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "MJ Logistic Services",
      },
    ],
    locale: "en_PK",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "MJ Logistic Services",
    description:
      "Reliable nationwide logistics, freight, and fleet solutions across Pakistan.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}