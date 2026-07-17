'use client'

import { useCallback, useState } from 'react'
import type { Editor } from '@tiptap/core'
import * as Popover from '@radix-ui/react-popover'
import { Link2, Link2Off } from 'lucide-react'
import { cn } from '../../lib/cn'

export function Link({ editor, className }: { editor: Editor; className?: string }) {
  const [url, setUrl] = useState('')
  const [open, setOpen] = useState(false)

  const isActive = editor.isActive('link')

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!url.trim()) {
        editor.chain().focus().unsetLink().run()
      } else {
        editor.chain().focus().toggleLink({ href: url }).run()
      }
      setOpen(false)
      setUrl('')
    },
    [url, editor]
  )

  const openEdit = useCallback(() => {
    const previousUrl = editor.getAttributes('link').href
    if (previousUrl) setUrl(previousUrl)
    setOpen(true)
  }, [editor])

  const removeLink = useCallback(() => {
    editor.chain().focus().unsetLink().run()
    setOpen(false)
  }, [editor])

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          onClick={openEdit}
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-md text-sm transition-colors',
            isActive ? 'bg-muted text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            className
          )}
        >
          {isActive ? <Link2Off className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="top"
          className="z-50 rounded-lg border bg-popover p-2 shadow-md"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Type or paste a link"
              className="h-8 w-48 rounded-md border bg-background px-2 text-sm"
              autoFocus
            />
            <button
              type="submit"
              className="h-8 rounded-md bg-primary px-3 text-xs text-primary-foreground"
            >
              Save
            </button>
            {isActive && (
              <button
                type="button"
                onClick={removeLink}
                className="h-8 rounded-md bg-destructive px-3 text-xs text-destructive-foreground"
              >
                Remove
              </button>
            )}
          </form>
          <Popover.Arrow className="fill-popover" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
