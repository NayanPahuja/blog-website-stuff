'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Editor } from '@tiptap/core'
import { commands, type EdraCommand } from '../commands'
import { cn } from '../lib/cn'
import { useEditorContext } from '../lib/editor-context'
import * as Separator from '@radix-ui/react-separator'
import * as Tooltip from '@radix-ui/react-tooltip'
import { Colors } from './tool-components/colors'
import { ExportTool } from './tool-components/export'

interface ToolbarProps {
  editor?: Editor | null
  className?: string
}

export function Toolbar({ editor: propEditor, className }: ToolbarProps) {
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

  return (
    <Tooltip.Provider delayDuration={200}>
      <div className={cn('flex items-center gap-0.5 p-1 overflow-x-auto', className)}>
        {Object.entries(commands).map(([groupKey, groupCommands]) => (
          <div key={groupKey} className="flex items-center gap-0.5">
            <Separator.Root orientation="vertical" className="h-6 w-px bg-border mx-1" decorative />
            {groupCommands.map((cmd) => (
              <ToolbarButton key={cmd.name} editor={editor} command={cmd} />
            ))}
          </div>
        ))}
        <Separator.Root orientation="vertical" className="h-6 w-px bg-border mx-1" decorative />
        <Colors editor={editor} />
        <ExportTool editor={editor} />
      </div>
    </Tooltip.Provider>
  )
}

function ToolbarButton({ editor, command: cmd }: { editor: Editor; command: EdraCommand }) {
  const isActive = cmd.isActive?.(editor) ?? false
  const clickable = cmd.clickable?.(editor) ?? true
  const Icon = cmd.icon

  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <button
          onClick={() => cmd.onClick?.(editor)}
          disabled={!clickable}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-md text-sm transition-colors',
            isActive ? 'bg-muted text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            !clickable && 'opacity-50 cursor-not-allowed'
          )}
        >
          {Icon && <Icon className="h-4 w-4" />}
        </button>
      </Tooltip.Trigger>
      <Tooltip.Content side="bottom" className="z-50 rounded-md bg-popover px-2 py-1 text-xs shadow-md border">
        {cmd.tooltip}
        {cmd.shortCut && <span className="ml-2 text-muted-foreground">{cmd.shortCut}</span>}
        <Tooltip.Arrow className="fill-popover" />
      </Tooltip.Content>
    </Tooltip.Root>
  )
}
