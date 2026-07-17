import { Video } from './video'
import { ReactNodeViewRenderer } from '@tiptap/react'
import type { ComponentType } from 'react'
import type { NodeViewProps } from '@tiptap/core'

export const VideoExtended = (component: ComponentType<any>) =>
  Video.extend({
    addAttributes() {
      return {
        src: { default: null },
        alt: { default: null },
        title: { default: null },
        width: { default: '100%' },
        height: { default: null },
        align: { default: 'left' },
      }
    },
    addNodeView: () => ReactNodeViewRenderer(component),
  })
