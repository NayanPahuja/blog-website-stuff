'use client'

import { useCallback } from 'react'
import type { Editor } from '@tiptap/core'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Palette } from 'lucide-react'
import { quickcolors } from '../../lib/utils'
import strings from '../../lib/strings'

export function Colors({ editor }: { editor: Editor }) {
  const setColor = useCallback((color: string) => {
    if (!color) editor.chain().focus().unsetColor().run()
    else editor.chain().focus().setColor(color).run()
  }, [editor])

  const setHighlight = useCallback((color: string) => {
    if (!color) editor.chain().focus().unsetHighlight().run()
    else editor.chain().focus().toggleHighlight({ color }).run()
  }, [editor])

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
          <Palette className="h-4 w-4" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          side="bottom"
          className="z-50 min-w-[160px] rounded-lg border bg-popover p-2 shadow-md"
        >
          <div className="px-1 py-1 text-xs font-medium text-muted-foreground">{strings.toolbar.color.textColors}</div>
          <div className="grid grid-cols-5 gap-1 p-1">
            {quickcolors.map((c) => (
              <button
                key={c.value || 'default'}
                onClick={() => setColor(c.value)}
                className="flex h-6 w-6 items-center justify-center rounded border text-xs hover:scale-110 transition-transform"
                style={{ backgroundColor: c.value || 'transparent' }}
                title={c.label}
              >
                {!c.value && <span className="text-muted-foreground">A</span>}
              </button>
            ))}
          </div>
          <div className="mt-2 h-px bg-border" />
          <div className="px-1 py-1 text-xs font-medium text-muted-foreground">{strings.toolbar.color.highlightColors}</div>
          <div className="grid grid-cols-5 gap-1 p-1">
            {quickcolors.map((c) => (
              <button
                key={`hl-${c.value || 'default'}`}
                onClick={() => setHighlight(c.value)}
                className="flex h-6 w-6 items-center justify-center rounded border text-xs hover:scale-110 transition-transform"
                style={{ backgroundColor: c.value ? `${c.value}33` : 'transparent' }}
                title={c.label}
              >
                {!c.value && <span className="text-muted-foreground">A</span>}
              </button>
            ))}
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
