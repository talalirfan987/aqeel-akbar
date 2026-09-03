import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import FloatingSupport from "@/components/FloatingSupport";
import MobileBottomNav from "@/components/MobileBottomNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Akeel Akbar Lottery",
    template: "%s · Akeel Akbar Lottery",
  },
  description: "Submit, verify, and manage your lottery ticket records securely and easily.",
  openGraph: {
    title: "Akeel Akbar Lottery",
    description: "Submit, verify, and manage your lottery ticket records securely and easily.",
    siteName: "Akeel Akbar Lottery",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 pb-16 md:pb-0">
        <I18nProvider>
          <SiteHeader />
          <div className="flex-1 flex flex-col">{children}</div>
          <SiteFooter />
          <FloatingSupport />
          <MobileBottomNav />
        </I18nProvider>
      </body>
    </html>
  );
}
