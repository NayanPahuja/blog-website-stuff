"use client"

import { createEditor, Edra } from "edra-react"
import { useEffect, useState } from "react"
import { sampleContent } from "./sample-content"

export default function Editor() {
  const [mounted, setMounted] = useState(false)
  const editor = createEditor()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || !editor) return
    
    // Defer setContent to avoid flushSync warning
    setTimeout(() => {
      let content = sampleContent
      try {
        const saved = localStorage.getItem("edra-content")
        if (saved && saved !== "[]") {
          content = JSON.parse(saved)
        }
      } catch {
        // ignore
      }
      editor.commands.setContent(content, { contentType: "json" } as any)
    }, 0)
  }, [mounted, editor])

  useEffect(() => {
    if (!editor) return
    const onUpdate = () => {
      localStorage.setItem("edra-content", JSON.stringify(editor.getJSON()))
    }
    editor.on("transaction", onUpdate)
    return () => { editor.off("transaction", onUpdate) }
  }, [editor])

  if (!editor) return null

  return (
    <Edra editor={editor}>
      <Edra.Toolbar className="border-b rounded-t-lg max-w-full scrollbar-none bg-muted dark:bg-muted/50 p-1 overflow-x-auto" />
      <Edra.Content className="*:outline-none text-base cursor-auto h-[30rem] w-full overflow-y-auto px-8 py-4" />
      <Edra.BubbleMenu />
    </Edra>
  )
}
