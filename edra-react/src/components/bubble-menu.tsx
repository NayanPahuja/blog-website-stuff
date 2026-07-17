'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Editor } from '@tiptap/core'
import { BubbleMenu as TiptapBubbleMenu } from '@tiptap/react/menus'
import { commands, type EdraCommand } from '../commands'
import { cn } from '../lib/cn'
import { useEditorContext } from '../lib/editor-context'
import * as Tooltip from '@radix-ui/react-tooltip'
import * as Separator from '@radix-ui/react-separator'
import { Lists } from './tool-components/lists'
import { AlignMent } from './tool-components/align-ment'
import { FontSize } from './tool-components/font-size'
import { Colors } from './tool-components/colors'
import { Link } from './tool-components/link'

interface BubbleMenuProps {
  editor?: Editor | null
  className?: string
}

export function BubbleMenu({ editor: propEditor, className }: BubbleMenuProps) {
  const ctxEditor = useEditorContext()
  const editor = propEditor ?? ctxEditor
  const [, setVersion] = useState(0)

  useEffect(() => {
    if (!editor) return
    const onTransaction = () => setVersion((v) => v + 1)
    editor.on('transaction', onTransaction)
    return () => { editor.off('transaction', onTransaction) }
  }, [editor])

  if (!editor) return null

  const shouldShow = useCallback(
    ({ editor: ed, from, to }: { editor: Editor; from: number; to: number }) => {
      if (!ed.isEditable || (ed.view as any).dragging) return false
      const sel = ed.state.selection

      if (sel.empty) return false
      if (ed.isActive('link')) return false
      if (ed.isActive('codeBlock')) return false
      if (ed.isActive('mediaPlaceholder')) return false
      if (ed.isActive('math')) return false
      if (ed.isActive('mermaid')) return false

      const node = sel.$from.node()
      if (node && node.content && node.content.size === 0) return false

      if (isTableGripSelected(editor)) return false

      return true
    },
    [editor]
  )

  const filteredCommands = Object.entries(commands).filter(
    ([key]) => !['media', 'table', 'diagram', 'undo-redo', 'headings'].includes(key)
  )

  return (
    <TiptapBubbleMenu
      editor={editor}
      shouldShow={shouldShow}
      className={cn('flex items-center gap-0.5 rounded-lg border bg-popover p-1 shadow-md', className)}
    >
      <Tooltip.Provider delayDuration={200}>
        {filteredCommands.map(([groupKey, groupCommands]) => (
          <div key={groupKey} className="flex items-center gap-0.5">
            <Separator.Root orientation="vertical" className="h-5 w-px bg-border mx-0.5" decorative />
            {groupKey === 'lists' ? (
              <Lists editor={editor} />
            ) : groupKey === 'alignment' ? (
              <AlignMent editor={editor} />
            ) : (
              groupCommands.map((cmd) => {
                if (cmd.name === 'paragraph') return <span key={cmd.name} className="hidden" />
                if (cmd.name === 'link') return <Link key={cmd.name} editor={editor} />
                return <BubbleButton key={cmd.name} editor={editor} command={cmd} />
              })
            )}
          </div>
        ))}
        <Separator.Root orientation="vertical" className="h-5 w-px bg-border mx-0.5" decorative />
        <FontSize editor={editor} />
        <Colors editor={editor} />
      </Tooltip.Provider>
    </TiptapBubbleMenu>
  )
}

function BubbleButton({ editor, command: cmd }: { editor: Editor; command: EdraCommand }) {
  const isActive = cmd.isActive?.(editor) ?? false
  const Icon = cmd.icon

  if (!Icon) return null

  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <button
          onClick={() => cmd.onClick?.(editor)}
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-md text-sm transition-colors',
            isActive ? 'bg-muted text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </button>
      </Tooltip.Trigger>
      <Tooltip.Content side="top" className="z-50 rounded-md bg-popover px-2 py-1 text-xs shadow-md border">
        {cmd.tooltip}
        <Tooltip.Arrow className="fill-popover" />
      </Tooltip.Content>
    </Tooltip.Root>
  )
}

function isTableGripSelected(editor: Editor): boolean {
  const view = editor.view
  const sel = editor.state.selection
  const from = sel.from
  const domAtPos = view.domAtPos(from).node as HTMLElement
  const nodeDOM = view.nodeDOM(from) as HTMLElement
  let container = nodeDOM || domAtPos

  while (container && !['TD', 'TH'].includes(container.tagName)) {
    container = container.parentElement!
  }
  if (!container) return false

  return !!(container.querySelector?.('a.grip-column.selected') || container.querySelector?.('a.grip-row.selected'))
}
