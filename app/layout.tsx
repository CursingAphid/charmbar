import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ToastProvider";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { OrientationHandler } from "@/components/OrientationHandler";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "charmbazaar - Custom Charm Bracelets",
  description: "Create your perfect charm bracelet. Choose a bracelet and add your favorite charms!",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={[
          geistSans.variable,
          geistMono.variable,
          'antialiased',
          // Elegant luxury background: soft white gradient with subtle texture
          'bg-gradient-to-br from-white via-gray-50/30 to-stone-50/50',
          'relative',
        ].join(' ')}
        style={{
          // Add subtle radial gradient overlay for depth
          backgroundImage: `
            radial-gradient(circle at 50% 0%, rgba(250, 250, 249, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 0% 100%, rgba(245, 245, 244, 0.2) 0%, transparent 50%)
          `,
        }}
      >
        <div className="relative z-10">
          <LanguageProvider>
            <ToastProvider>
              <OrientationHandler />
        {children}
            </ToastProvider>
          </LanguageProvider>
        </div>
      </body>
    </html>
  );
}
