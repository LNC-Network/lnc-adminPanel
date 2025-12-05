import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "next-themes";
import { Analytics } from "@vercel/analytics/next";
import { PWARegister, InstallPrompt } from "@/components/pwa-register";
import AnalyticsTracker from "@/components/analytics-tracker";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://lnc-admin-panel.vercel.app";

export const metadata: Metadata = {
  // Basic Meta
  title: {
    default: "LNC Admin Panel | Network Management Dashboard",
    template: "%s | LNC Admin Panel",
  },
  description: "Powerful administrative dashboard for LNC Network. Manage users, teams, content, analytics, and communications all in one place. Secure, fast, and feature-rich.",
  keywords: [
    "LNC Network",
    "Admin Panel",
    "Dashboard",
    "Team Management",
    "User Management",
    "Content Management",
    "Analytics Dashboard",
    "Network Administration",
    "LNC Admin",
    "Project Management",
    "LNC community Admin Panel",
    "LNC Community Admin",
    "LNC Community"
  ],
  authors: [
    { name: "LNC Network", url: siteUrl },
    { name: "Rohit Kumar Kundu", url: "mailto:kundurohit53@gmail.com" }
  ],
  creator: "LNC Network",
  publisher: "LNC Network",

  // Canonical URL
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: "/",
  },

  // Open Graph
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "LNC Admin Panel",
    title: "LNC Admin Panel | Network Management Dashboard",
    description: "Powerful administrative dashboard for LNC Network. Manage users, teams, content, analytics, and communications all in one place.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "LNC Admin Panel - Network Management Dashboard",
      },
    ],
  },

  // Twitter Card
  twitter: {
    card: "summary_large_image",
    title: "LNC Admin Panel | Network Management Dashboard",
    description: "Powerful administrative dashboard for LNC Network. Manage users, teams, content, analytics, and communications.",
    images: ["/og-image.png"],
    creator: "@LNCNetwork",
  },

  // Robots
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // PWA / App
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "LNC Admin",
  },

  // Icons
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: '/icons/icon-192x192.svg', sizes: '192x192', type: 'image/svg+xml' },
      { url: '/icons/icon-512x512.svg', sizes: '512x512', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.svg', sizes: '180x180', type: 'image/svg+xml' },
    ],
    shortcut: ["/favicon.ico"],
  },

  // Verification (add your IDs)
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || "",
    // yandex: "",
    // bing: "",
  },

  // Category
  category: "Technology",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // JSON-LD Structured Data for SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "LNC Admin Panel",
    "description": "Administrative dashboard for LNC Network management",
    "url": siteUrl,
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web Browser",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "author": {
      "@type": "Organization",
      "name": "LNC Network",
      "url": siteUrl,
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "Customer Support",
        "email": "kundurohit53@gmail.com",
        "name": "Rohit Kumar Kundu"
      }
    },
    "maintainer": {
      "@type": "Person",
      "name": "Rohit Kumar Kundu",
      "email": "kundurohit53@gmail.com"
    }
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        {/* PWA */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="LNC Admin" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark">
          <PWARegister />
          <InstallPrompt />
          <AnalyticsTracker />
          {children}
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
