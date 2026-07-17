"use client"

import dynamic from "next/dynamic"
import { useState } from "react"
import { Monitor, Smartphone, Tablet } from "lucide-react"

const Editor = dynamic(() => import("@/components/editor"), { ssr: false })

export default function Home() {
  const [device, setDevice] = useState<"mobile" | "tablet" | "desktop">("desktop")
  const [tab, setTab] = useState<"preview" | "code">("preview")

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-foreground text-background flex items-center justify-center font-bold text-sm">
            E
          </div>
          <span className="text-xl font-semibold font-sans">Edra</span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="https://github.com/your-org/edra-react"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            GitHub
          </a>
        </div>
      </header>

      <div className="mx-auto flex flex-col items-center gap-4 py-20 px-4 text-center">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl text-balance">
          Rich Editor for React
        </h1>
        <p className="text-xl text-muted-foreground max-w-lg">
          Thoughtfully designed. Copy and paste into your apps.
        </p>
      </div>

      <div className="w-[95%] mx-auto pb-20">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1 rounded-lg bg-muted p-0.5">
            <button
              onClick={() => setTab("preview")}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                tab === "preview" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              Preview
            </button>
            <button
              onClick={() => setTab("code")}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                tab === "code" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              Code
            </button>
          </div>
          <div className="flex items-center gap-1 rounded-lg bg-muted p-0.5">
            <button
              onClick={() => setDevice("desktop")}
              className={`p-1.5 rounded-md transition-colors ${
                device === "desktop" ? "bg-background shadow-sm" : "text-muted-foreground"
              }`}
            >
              <Monitor className="size-4" />
            </button>
            <button
              onClick={() => setDevice("tablet")}
              className={`p-1.5 rounded-md transition-colors ${
                device === "tablet" ? "bg-background shadow-sm" : "text-muted-foreground"
              }`}
            >
              <Tablet className="size-4" />
            </button>
            <button
              onClick={() => setDevice("mobile")}
              className={`p-1.5 rounded-md transition-colors ${
                device === "mobile" ? "bg-background shadow-sm" : "text-muted-foreground"
              }`}
            >
              <Smartphone className="size-4" />
            </button>
          </div>
        </div>

        {tab === "preview" ? (
          <div
            className={`border rounded-lg transition-all duration-500 overflow-hidden ${
              device === "desktop" ? "max-w-full" : device === "tablet" ? "max-w-xl mx-auto" : "max-w-sm mx-auto"
            }`}
          >
            <Editor />
          </div>
        ) : (
          <div className="border rounded-lg p-6 bg-muted/30">
            <pre className="text-sm font-mono whitespace-pre-wrap text-muted-foreground">
              {`import { createEditor, Edra } from "edra-react"

export default function MyEditor() {
  const editor = createEditor()

  if (!editor) return null

  return (
    <Edra editor={editor}>
      <Edra.Toolbar />
      <Edra.Content />
      <Edra.BubbleMenu />
    </Edra>
  )
}`}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
