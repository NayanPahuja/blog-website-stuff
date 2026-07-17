import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "pkg/nayan",
  description:
    "A personal knowledge garden — technical blog, portfolio, and private writing workspace.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                try {
                  var p = localStorage.getItem("theme") || "system";
                  var m = window.matchMedia("(prefers-color-scheme: dark)");
                  var t = p === "dark" || (p === "system" && m.matches) ? "dark" : "light";
                  document.documentElement.setAttribute("data-theme", t);
                  document.documentElement.setAttribute("data-theme-preference", p);
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)] transition-colors duration-200">
        <div className="page flex flex-col min-h-screen">
          <div className="page-content flex-1 flex flex-col">
            <SiteHeader />
            <main id="main" className="flex-1">
              {children}
            </main>
          </div>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
