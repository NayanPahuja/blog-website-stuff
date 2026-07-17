import type { Node } from '@tiptap/core'
import Image, { type ImageOptions } from '@tiptap/extension-image'
import { ReactNodeViewRenderer } from '@tiptap/react'
import type { ComponentType } from 'react'

export const ImageExtended = (component: ComponentType<any>): Node<ImageOptions, unknown> => {
  return Image.extend({
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
  }).configure({ allowBase64: false })
}
