import type { Metadata } from "next"
import { DM_Sans, Fira_Code } from "next/font/google"
import "./globals.css"
import "./edra.css"

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
})

const firaCode = Fira_Code({
  variable: "--font-fira-code",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title: "Edra React | Rich Text Editor for React",
  description: "A modern, extensible rich text editor for React built on Tiptap.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${firaCode.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  )
}
