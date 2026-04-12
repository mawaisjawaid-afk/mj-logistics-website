import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
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
      <head>
        <meta
          name="facebook-domain-verification"
          content="m8qvinyu9zvqvzb4h7a77jpo1aa3ts"
        />
      </head>
      <body className="min-h-full flex flex-col">
        {/* Meta Pixel (NoScript fallback) */}
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=2878695815813009&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>

        {children}
      </body>

      {/* Meta Pixel Script */}
      <Script id="meta-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          
          fbq('init', '2878695815813009');
          fbq('track', 'PageView');
        `}
      </Script>
    </html>
  );
}