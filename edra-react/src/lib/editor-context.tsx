'use client'

import { createContext, useContext } from 'react'
import type { Editor } from '@tiptap/core'

const EditorContext = createContext<Editor | null>(null)

export function useEditorContext() {
  return useContext(EditorContext)
}

export function EditorProvider({ editor, children }: { editor: Editor | null; children: React.ReactNode }) {
  return <EditorContext value={editor}>{children}</EditorContext>
}
