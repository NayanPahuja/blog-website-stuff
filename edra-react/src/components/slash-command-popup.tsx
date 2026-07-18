'use client'

import { useEffect, useRef } from 'react'
import type { EdraCommand } from '../commands'

interface FilteredGroup {
  name: string
  title: string
  commands: EdraCommand[]
}

interface SlashCommandPopupProps {
  items: FilteredGroup[]
  selectedGroupIdx: number
  selectedCommandIdx: number
  onHover: (groupIdx: number, commandIdx: number) => void
  command: (item: EdraCommand) => void
}

export function SlashCommandPopup({
  items,
  selectedGroupIdx,
  selectedCommandIdx,
  onHover,
  command,
}: SlashCommandPopupProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (containerRef.current) {
      const active = containerRef.current.querySelector('[data-active="true"]')
      if (active) active.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedGroupIdx, selectedCommandIdx])

  if (items.length === 0) return null

  return (
    <div
      ref={containerRef}
      className="max-h-72 w-56 overflow-y-auto rounded-lg border bg-popover p-1 shadow-md"
    >
      {items.map((group, gi) => (
        <div key={group.name}>
          {gi > 0 && <div className="h-px bg-border mx-1 my-1" />}
          <div className="px-2 py-1 text-xs font-medium text-muted-foreground">{group.title}</div>
          {group.commands.map((cmd, ci) => {
            const isActive = gi === selectedGroupIdx && ci === selectedCommandIdx
            const Icon = cmd.icon
            return (
              <button
                key={cmd.name}
                data-active={isActive}
                onPointerEnter={() => onHover(gi, ci)}
                onClick={(e) => {
                  e.stopPropagation()
                  command(cmd)
                }}
                className={`flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm ${
                  isActive ? 'bg-accent text-accent-foreground' : 'text-popover-foreground'
                }`}
              >
                {Icon && <Icon className="h-4 w-4 shrink-0" />}
                <span className="truncate">{cmd.tooltip}</span>
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}
