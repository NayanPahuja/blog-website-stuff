import type { Editor } from '@tiptap/core'

export interface EdraEditorProps {
  onUpdate?: () => void
  onFileUpload?: (file: File) => Promise<string>
}

export type EdraEditorOptions = Record<string, never>
