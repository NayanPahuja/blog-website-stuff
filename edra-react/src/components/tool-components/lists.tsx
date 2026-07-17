'use client'

import type { Editor } from '@tiptap/core'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { List, ListOrdered, ListChecks } from 'lucide-react'
import strings from '../../lib/strings'

export function Lists({ editor }: { editor: Editor }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
          <List className="h-3.5 w-3.5" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          side="top"
          className="z-50 min-w-[120px] rounded-lg border bg-popover p-1 shadow-md"
        >
          <DropdownMenu.Item
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
          >
            <List className="h-4 w-4" />
            {strings.command.bulletList}
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
          >
            <ListOrdered className="h-4 w-4" />
            {strings.command.orderedList}
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
          >
            <ListChecks className="h-4 w-4" />
            {strings.command.taskList}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
