import { TempoInit } from "@/components/tempo-init";
import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/contexts/AuthContext";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SessionMailer - Professional Email Templates for Photographers",
  description: "Create beautiful, professional email templates from your usesession.com photo sessions. Customize colors, fonts, and branding to match your photography business.",
  keywords: [
    "email templates",
    "photography",
    "usesession",
    "photo sessions",
    "email marketing",
    "photographer tools",
    "professional emails",
    "email design",
    "photography business",
    "client communication"
  ],
  authors: [{ name: "SessionMailer" }],
  creator: "SessionMailer",
  publisher: "SessionMailer",
  metadataBase: new URL('https://sessionmailer.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://sessionmailer.com',
    title: 'SessionMailer - Transform Photo Sessions Into Beautiful Emails',
    description: '🎨 Turn your usesession.com photo sessions into stunning, professional email templates in seconds. ✨ Full customization, unlimited templates, only $10/month.',
    siteName: 'SessionMailer',
    images: [
      {
        url: '/og-image.png', // We'll create this
        width: 1200,
        height: 630,
        alt: 'SessionMailer - Professional Email Templates for Photographers',
        type: 'image/png',
      },
      {
        url: '/og-image-square.png', // We'll create this too
        width: 1200,
        height: 1200,
        alt: 'SessionMailer Logo',
        type: 'image/png',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SessionMailer - Transform Photo Sessions Into Beautiful Emails',
    description: '🎨 Turn your usesession.com photo sessions into stunning, professional email templates in seconds. ✨ Full customization, unlimited templates, only $10/month.',
    creator: '@sessionmailer', // Update with your actual Twitter handle
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add these when you set up verification
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
    // yahoo: 'your-yahoo-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link 
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Open+Sans:wght@400;600&family=Lato:wght@400;700&family=Montserrat:wght@400;600;700&family=Roboto:wght@400;500;700&family=Poppins:wght@400;600;700&family=Merriweather:wght@400;700&family=Lora:wght@400;700&family=Source+Sans+Pro:wght@400;600&family=Nunito:wght@400;600;700&family=Inter:wght@400;500;600&family=Crimson+Text:wght@400;600&display=swap" 
          rel="stylesheet" 
        />
        
        {/* Favicons and Icons */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        
        {/* Theme colors */}
        <meta name="theme-color" content="#6366f1" />
        <meta name="msapplication-TileColor" content="#6366f1" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        
        {/* Additional meta tags */}
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="SessionMailer" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "SessionMailer",
              "description": "Professional email template generator for photographers using usesession.com photo sessions",
              "url": "https://sessionmailer.com",
              "applicationCategory": "BusinessApplication",
              "operatingSystem": "Web",
              "offers": {
                "@type": "Offer",
                "price": "10",
                "priceCurrency": "USD",
                "priceSpecification": {
                  "@type": "RecurringCharge",
                  "frequency": "Monthly"
                }
              },
              "creator": {
                "@type": "Organization",
                "name": "SessionMailer"
              },
              "audience": {
                "@type": "Audience",
                "audienceType": "Photographers"
              },
              "featureList": [
                "Convert usesession.com URLs to email templates",
                "Customize colors and fonts",
                "Professional email design",
                "Multiple session support",
                "Save and manage projects"
              ]
            })
          }}
        />
      </head>
      <Script src="https://api.tempolabs.ai/proxy-asset?url=https://storage.googleapis.com/tempo-public-assets/error-handling.js" />
      <body className={inter.className}>
        <AuthProvider>
          <Navbar />
          <main className="min-h-screen bg-gray-50">
        {children}
          </main>
        </AuthProvider>
        <TempoInit />
      </body>
    </html>
  );
}
