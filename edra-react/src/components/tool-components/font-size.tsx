'use client'

import { useCallback } from 'react'
import type { Editor } from '@tiptap/core'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Type } from 'lucide-react'
import strings from '../../lib/strings'

const FONT_SIZES = [
  { label: strings.toolbar.font.tiny, value: '12px' },
  { label: strings.toolbar.font.smaller, value: '14px' },
  { label: strings.toolbar.font.small, value: '16px' },
  { label: strings.toolbar.font.default, value: '' },
  { label: strings.toolbar.font.large, value: '20px' },
  { label: strings.toolbar.font.extraLarge, value: '24px' },
]

export function FontSize({ editor }: { editor: Editor }) {
  const setSize = useCallback((value: string) => {
    if (!value) editor.chain().focus().unsetFontSize().run()
    else editor.chain().focus().setFontSize(value).run()
  }, [editor])

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
          <Type className="h-3.5 w-3.5" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          side="top"
          className="z-50 min-w-[100px] rounded-lg border bg-popover p-1 shadow-md"
        >
          {FONT_SIZES.map((fs) => (
            <DropdownMenu.Item
              key={fs.value || 'default'}
              onClick={() => setSize(fs.value)}
              className="flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
            >
              {fs.label}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
