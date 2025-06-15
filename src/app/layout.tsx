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
