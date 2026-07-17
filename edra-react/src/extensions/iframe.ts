import { Node, type NodeViewProps } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import type { ComponentType } from 'react'

export interface IframeOptions {
  allowFullscreen: boolean
  HTMLAttributes: { [key: string]: unknown }
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    iframe: {
      setIframe: (options: { src: string }) => ReturnType
      removeIframe: () => ReturnType
    }
  }
}

const IFrame = Node.create<IframeOptions>({
  name: 'iframe',
  group: 'block',
  atom: true,

  addOptions() {
    return {
      allowFullscreen: true,
      HTMLAttributes: { class: 'iframe-wrapper' },
    }
  },

  addAttributes() {
    return {
      src: { default: null },
      frameborder: { default: 0 },
      allowfullscreen: {
        default: this.options.allowFullscreen,
        parseHTML: () => this.options.allowFullscreen,
      },
    }
  },

  parseHTML() {
    return [{ tag: 'iframe' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', this.options.HTMLAttributes, ['iframe', HTMLAttributes]]
  },

  addCommands() {
    return {
      setIframe:
        (options: { src: string }) =>
        ({ tr, dispatch }) => {
          const { selection } = tr
          const node = this.type.create(options)
          if (dispatch) tr.replaceRangeWith(selection.from, selection.to, node)
          return true
        },
      removeIframe:
        () =>
        ({ commands }) =>
          commands.deleteNode(this.name),
    }
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('iframePasteHandler'),
        props: {
          handlePaste: (view, event) => {
            const text = event.clipboardData?.getData('text/plain')
            if (!text) return false

            const trimmed = text.trim()
            if (trimmed.includes('<iframe') && trimmed.includes('</iframe>')) {
              try {
                const parser = new DOMParser()
                const htmlDoc = parser.parseFromString(trimmed, 'text/html')
                const iframeEl = htmlDoc.querySelector('iframe')
                if (iframeEl) {
                  const src = iframeEl.getAttribute('src')
                  if (src) {
                    const { state, dispatch } = view
                    const { selection } = state
                    const node = this.type.create({
                      src,
                      width: iframeEl.getAttribute('width') || '100%',
                      height: iframeEl.getAttribute('height') || null,
                      title: iframeEl.getAttribute('title') || null,
                      alt: iframeEl.getAttribute('alt') || null,
                      align: iframeEl.getAttribute('align') || 'left',
                    })
                    if (dispatch) {
                      dispatch(state.tr.replaceRangeWith(selection.from, selection.to, node))
                    }
                    return true
                  }
                }
              } catch {
                return false
              }
            }
            return false
          },
        },
      }),
    ]
  },
})

export const IFrameExtended = (component: ComponentType<any>) =>
  IFrame.extend({
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

export default IFrame
