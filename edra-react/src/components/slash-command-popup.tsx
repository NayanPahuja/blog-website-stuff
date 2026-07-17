'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { EdraCommand } from '../commands'

interface FilteredGroup {
  name: string
  title: string
  commands: EdraCommand[]
}

interface SlashCommandPopupProps {
  items: FilteredGroup[]
  command: (item: EdraCommand) => void
}

export function SlashCommandPopup({ items, command }: SlashCommandPopupProps) {
  const [selectedGroupIdx, setSelectedGroupIdx] = useState(0)
  const [selectedCommandIdx, setSelectedCommandIdx] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const flatCommands = items.flatMap((g) => g.commands)

  useEffect(() => {
    setSelectedGroupIdx(0)
    setSelectedCommandIdx(0)
  }, [items])

  useEffect(() => {
    if (containerRef.current) {
      const active = containerRef.current.querySelector('[data-active="true"]')
      if (active) active.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedGroupIdx, selectedCommandIdx])

  const selectItem = useCallback(() => {
    const group = items[selectedGroupIdx]
    if (!group) return
    const cmd = group.commands[selectedCommandIdx]
    if (cmd) command(cmd)
  }, [items, selectedGroupIdx, selectedCommandIdx, command])

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
                onPointerEnter={() => {
                  setSelectedGroupIdx(gi)
                  setSelectedCommandIdx(ci)
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  selectItem()
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

export function handleKeyDown(
  e: KeyboardEvent,
  items: FilteredGroup[],
  selectedGroupIdx: number,
  selectedCommandIdx: number,
  setSelectedGroupIdx: (v: number) => void,
  setSelectedCommandIdx: (v: number) => void,
  selectItem: () => void
): boolean {
  const flatCommands = items.flatMap((g) => g.commands)

  switch (e.key) {
    case 'ArrowDown':
    case 'Tab':
      e.preventDefault()
      if (!e.shiftKey) {
        const next = flatCommands.indexOf(
          items[selectedGroupIdx]?.commands[selectedCommandIdx]
        )
        const nextIdx = next + 1
        if (nextIdx < flatCommands.length) {
          let count = 0
          for (let gi = 0; gi < items.length; gi++) {
            for (let ci = 0; ci < items[gi].commands.length; ci++) {
              if (count === nextIdx) {
                setSelectedGroupIdx(gi)
                setSelectedCommandIdx(ci)
                return true
              }
              count++
            }
          }
        }
      } else {
        const prev = flatCommands.indexOf(
          items[selectedGroupIdx]?.commands[selectedCommandIdx]
        )
        const prevIdx = prev - 1
        if (prevIdx >= 0) {
          let count = 0
          for (let gi = 0; gi < items.length; gi++) {
            for (let ci = 0; ci < items[gi].commands.length; ci++) {
              if (count === prevIdx) {
                setSelectedGroupIdx(gi)
                setSelectedCommandIdx(ci)
                return true
              }
              count++
            }
          }
        }
      }
      return true
    case 'ArrowUp':
      e.preventDefault()
      if (!e.shiftKey) {
        const prev = flatCommands.indexOf(
          items[selectedGroupIdx]?.commands[selectedCommandIdx]
        )
        const prevIdx = prev - 1
        if (prevIdx >= 0) {
          let count = 0
          for (let gi = 0; gi < items.length; gi++) {
            for (let ci = 0; ci < items[gi].commands.length; ci++) {
              if (count === prevIdx) {
                setSelectedGroupIdx(gi)
                setSelectedCommandIdx(ci)
                return true
              }
              count++
            }
          }
        }
      }
      return true
    case 'Enter':
      e.preventDefault()
      selectItem()
      return true
    case 'Escape':
      return true
    default:
      return false
  }
}
