'use client'

import { useEditor } from '@tiptap/react'
import { ReactNodeViewRenderer } from '@tiptap/react'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'
import type { EdraEditorProps } from './types'
import baseExtensions from './extensions/extensions'
import { MediaPlaceholder, ImageExtended, VideoExtended, IFrameExtended, Mermaid, Callout, SlashCommand } from './extensions'
import { CodeBlock } from './components/node-views/code-block'
import { ImageNodeView } from './components/node-views/image'
import { VideoNodeView } from './components/node-views/video'
import { AudioNodeView } from './components/node-views/audio'
import { IFrameNodeView } from './components/node-views/iframe'
import { MermaidNodeView } from './components/node-views/mermaid'
import { CalloutNodeView } from './components/node-views/callout'
import { MediaPlaceholderNodeView } from './components/node-views/media-placeholder'
import { SlashCommandPopup } from './components/slash-command-popup'
import { TableOfContents } from '@tiptap/extension-table-of-contents'

const lowlight = createLowlight(common)

interface EdraEditorReturn {
  editor: ReturnType<typeof useEditor>
}

export function createEditor(props: EdraEditorProps = {}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      ...baseExtensions,
      CodeBlockLowlight.configure({
        lowlight,
      }).extend({
        addNodeView() {
          return ReactNodeViewRenderer(CodeBlock)
        },
      }),
      MediaPlaceholder(MediaPlaceholderNodeView).configure({
        onUpload: props.onFileUpload,
      }),
      ImageExtended(ImageNodeView),
      VideoExtended(VideoNodeView),
      IFrameExtended(IFrameNodeView),
      Mermaid(MermaidNodeView),
      Callout(CalloutNodeView),
      SlashCommand(SlashCommandPopup as any),
      TableOfContents.configure({
        getIndex: (node: any) => {
          return node.attrs?.level || 1
        },
      }),
    ],
    onUpdate: props.onUpdate,
  })

  return editor
}
