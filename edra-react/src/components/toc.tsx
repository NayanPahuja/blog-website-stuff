'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Editor } from '@tiptap/core'
import { cn } from '../lib/cn'
import { useEditorContext } from '../lib/editor-context'

interface TocItem {
  id: string
  level: number
  text: string
}

export function ToC({ editor: propEditor, className }: { editor?: Editor | null; className?: string }) {
  const ctxEditor = useEditorContext()
  const editor = propEditor ?? ctxEditor
  const [items, setItems] = useState<TocItem[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    if (!editor) return

    const handleUpdate = () => {
      const headings: TocItem[] = []
      editor.state.doc.descendants((node: any, pos: number) => {
        if (node.type.name === 'heading') {
          const id = `heading-${pos}`
          headings.push({ id, level: node.attrs.level, text: node.textContent })
        }
      })
      setItems(headings)
    }

    editor.on('update', handleUpdate)
    handleUpdate()
    return () => { editor.off('update', handleUpdate) }
  }, [editor])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId(entry.target.id)
        }
      },
      { rootMargin: '-80px 0px -80% 0px' }
    )

    items.forEach((item) => {
      const el = document.getElementById(item.id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [items])

  if (items.length === 0) return null

  return (
    <div className={cn('fixed right-2 top-1/3 z-40 flex flex-col gap-1', className)}>
      {items.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          onClick={(e) => {
            e.preventDefault()
            const el = document.getElementById(item.id)
            if (el) el.scrollIntoView({ behavior: 'smooth' })
          }}
          className={cn(
            'block h-0.5 rounded-full transition-all',
            activeId === item.id ? 'bg-primary w-6' : 'bg-muted-foreground/30 w-4 hover:w-6'
          )}
          style={{ paddingLeft: `${(item.level - 1) * 0.5}rem` }}
          title={item.text}
        />
      ))}
    </div>
  )
}
