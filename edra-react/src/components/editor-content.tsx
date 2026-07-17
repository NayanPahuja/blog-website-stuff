'use client'

import { EditorContent as TiptapEditorContent } from '@tiptap/react'
import { cn } from '../lib/cn'
import type { Editor } from '@tiptap/core'
import { useEditorContext } from '../lib/editor-context'
import 'katex/dist/katex.min.css'

interface EditorContentProps {
  editor?: Editor | null
  className?: string
}

export function EditorContent({ editor: propEditor, className }: EditorContentProps) {
  const ctxEditor = useEditorContext()
  const editor = propEditor ?? ctxEditor
  if (!editor) return null

  return (
    <TiptapEditorContent
      editor={editor}
      className={cn('prose prose-sm max-w-none focus:outline-none', className)}
    />
  )
}
