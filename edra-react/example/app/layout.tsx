import type { Metadata } from "next"
import "./fonts.css"
import "./globals.css"
import "edra-react/styles/editor.css"
import "edra-react/styles/onedark.css"

export const metadata: Metadata = {
  title: "Edra React | Rich Text Editor for React",
  description: "A modern, extensible rich text editor for React built on Tiptap.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
