'use client'

import { NodeViewWrapper, NodeViewContent, type NodeViewProps } from '@tiptap/react'
import { useState, useCallback, useRef, useEffect } from 'react'

const EMOJIS = ['💡', '📝', '⚠️', '✅', '❌', '🔍', '📌', '🎯', '💪', '🚀', '⭐', '📢', '🔔', '💡', '📎']

export function CalloutNodeView(props: NodeViewProps) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  const toggleEmojiPicker = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setPosition({ top: rect.bottom + 4, left: rect.left })
    }
    setOpen((prev) => !prev)
  }, [])

  const selectEmoji = useCallback(
    (emoji: string) => {
      props.updateAttributes({ emoji })
      setOpen(false)
    },
    [props.updateAttributes]
  )

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <NodeViewWrapper className="callout-node-view relative flex gap-2 rounded-lg border border-border bg-muted/30 p-4">
      <button
        ref={buttonRef}
        onClick={toggleEmojiPicker}
        className="text-xl hover:bg-muted rounded px-1 shrink-0 h-fit"
        contentEditable={false}
      >
        {props.node.attrs.emoji || '💡'}
      </button>

      {open && (
        <div
          ref={popoverRef}
          className="fixed z-50 grid grid-cols-5 gap-1 p-2 bg-popover border rounded-lg shadow-lg"
          style={{ top: position.top, left: position.left }}
          contentEditable={false}
        >
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => selectEmoji(emoji)}
              className="text-lg p-1 hover:bg-muted rounded"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <NodeViewContent className="callout-content [&>p]:m-0" />
      </div>
    </NodeViewWrapper>
  )
}
