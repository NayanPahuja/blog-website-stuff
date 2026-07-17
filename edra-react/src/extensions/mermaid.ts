import { mergeAttributes, Node, textblockTypeInputRule } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import type { ComponentType } from 'react'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    mermaid: {
      setMermaid: (code?: string) => ReturnType
    }
  }
}

export const Mermaid = (component: ComponentType<any>) =>
  Node.create({
    name: 'mermaid',
    group: 'block',
    content: 'text*',
    atom: true,
    code: true,
    defining: true,
    isolating: true,
    draggable: true,

    addAttributes() {
      return { HTMLAttributes: { default: {} } }
    },

    markdownTokenizer: {
      name: 'mermaid',
      level: 'block',
      start: (src: string) => src.indexOf(':::'),
      tokenize: (src: string) => {
        const match = /^:::mermaid\n([\s\S]*?)\n:::/.exec(src)
        if (!match) return undefined
        return { type: 'mermaid', raw: match[0], text: match[1] }
      },
    },

    parseMarkdown: (token: any) => ({
      type: 'mermaid',
      content: [{ type: 'text', text: token.text }],
    }),

    renderMarkdown: (node: any, helpers: any) =>
      `:::mermaid\n${helpers.renderChildren(node)}\n:::\n\n`,

    parseHTML() {
      return [{ tag: `div[data-type="${this.name}"]`, preserveWhitespace: 'full' }]
    },

    renderHTML({ HTMLAttributes }) {
      return ['div', mergeAttributes({ 'data-type': this.name }, this.options.HTMLAttributes, HTMLAttributes), 0]
    },

    addCommands() {
      return {
        setMermaid:
          (code) =>
          ({ commands }) =>
            commands.insertContent({ type: this.name, content: [{ type: 'text', text: code || '' }] }),
      }
    },

    addInputRules() {
      return [
        textblockTypeInputRule({
          find: /^:::mermaid$/,
          type: this.type,
        }),
      ]
    },

    addNodeView() {
      return ReactNodeViewRenderer(component)
    },
  })
