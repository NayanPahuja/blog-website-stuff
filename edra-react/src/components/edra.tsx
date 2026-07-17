'use client'

import { EditorContent } from './editor-content'
import { Toolbar } from './toolbar'
import { BubbleMenu } from './bubble-menu'
import { ToC } from './toc'
import { EditorProvider } from '../lib/editor-context'
import type { Editor } from '@tiptap/core'

function EdraWrapper({ editor, children }: { editor: Editor | null; children: React.ReactNode }) {
  return (
    <EditorProvider editor={editor}>
      {children}
    </EditorProvider>
  )
}

EdraWrapper.Content = EditorContent
EdraWrapper.Toolbar = Toolbar
EdraWrapper.BubbleMenu = BubbleMenu
EdraWrapper.ToC = ToC

export const Edra = EdraWrapper
