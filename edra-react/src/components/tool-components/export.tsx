'use client'

import { useCallback } from 'react'
import type { Editor } from '@tiptap/core'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Download } from 'lucide-react'

export function ExportTool({ editor }: { editor: Editor }) {
  const exportAs = useCallback((format: 'html' | 'markdown' | 'json') => {
    let content = ''
    let mimeType = ''
    let extension = ''

    switch (format) {
      case 'html':
        content = editor.getHTML()
        mimeType = 'text/html'
        extension = 'html'
        break
      case 'markdown':
        content = editor.storage.markdown?.getMarkdown() || editor.getText()
        mimeType = 'text/markdown'
        extension = 'md'
        break
      case 'json':
        content = JSON.stringify(editor.getJSON(), null, 2)
        mimeType = 'application/json'
        extension = 'json'
        break
    }

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `document.${extension}`
    a.click()
    URL.revokeObjectURL(url)
  }, [editor])

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
          <Download className="h-4 w-4" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          side="bottom"
          className="z-50 min-w-[120px] rounded-lg border bg-popover p-1 shadow-md"
        >
          <DropdownMenu.Item
            onClick={() => exportAs('html')}
            className="flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
          >
            HTML
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onClick={() => exportAs('markdown')}
            className="flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
          >
            Markdown
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onClick={() => exportAs('json')}
            className="flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
          >
            JSON
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
