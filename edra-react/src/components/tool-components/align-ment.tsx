'use client'

import type { Editor } from '@tiptap/core'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { AlignCenter, AlignJustify, AlignLeft, AlignRight } from 'lucide-react'
import strings from '../../lib/strings'

export function AlignMent({ editor }: { editor: Editor }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
          <AlignLeft className="h-3.5 w-3.5" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          side="top"
          className="z-50 min-w-[130px] rounded-lg border bg-popover p-1 shadow-md"
        >
          <DropdownMenu.Item
            onClick={() => editor.chain().focus().toggleTextAlign('left').run()}
            className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
          >
            <AlignLeft className="h-4 w-4" />
            {strings.command.alignLeft}
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onClick={() => editor.chain().focus().toggleTextAlign('center').run()}
            className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
          >
            <AlignCenter className="h-4 w-4" />
            {strings.command.alignCenter}
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onClick={() => editor.chain().focus().toggleTextAlign('right').run()}
            className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
          >
            <AlignRight className="h-4 w-4" />
            {strings.command.alignRight}
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onClick={() => editor.chain().focus().toggleTextAlign('justify').run()}
            className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
          >
            <AlignJustify className="h-4 w-4" />
            {strings.command.alignJustify}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
