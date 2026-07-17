import { mergeAttributes, Node, wrappingInputRule, type NodeViewProps } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import type { ComponentType } from 'react'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    callout: {
      setCallout: () => ReturnType
    }
  }
}

export const Callout = (component: ComponentType<any>) =>
  Node.create({
    name: 'callout',
    content: 'paragraph+',
    group: 'block',
    defining: true,
    selectable: true,
    draggable: true,

    addAttributes() {
      return { emoji: { default: '💡' } }
    },

    markdownTokenizer: {
      name: 'callout',
      level: 'block',
      start: (src: string) => src.indexOf('$'),
      tokenize: (src: string) => {
        const match = /^\$callout\s*(.*)?\n([\s\S]*?)\n\$/.exec(src)
        if (!match) return undefined
        return { type: 'callout', raw: match[0], emoji: match[1]?.trim() || '💡', text: match[2] }
      },
    },

    parseMarkdown: (token: any, helpers: any) => ({
      type: 'callout',
      attrs: { emoji: token.emoji },
      content: helpers.parseChildren(token.tokens || []),
    }),

    renderMarkdown: (node: any, helpers: any) => {
      const content = helpers.renderChildren(node)
      const emoji = node.attrs?.emoji || '💡'
      return `$callout${emoji}\n${content}\n$\n\n`
    },

    addOptions() {
      return { HTMLAttributes: { class: 'callout' } }
    },

    parseHTML() {
      return [{ tag: 'div[class=callout]' }]
    },

    renderHTML({ HTMLAttributes }) {
      return ['div', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0]
    },

    addCommands() {
      return {
        setCallout:
          () =>
          ({ commands, editor }) => {
            const { type = null } = editor.getAttributes(this.name)
            if (type) return commands.lift(this.name)
            return commands.toggleWrap(this.name)
          },
      }
    },

    addInputRules() {
      return [
        wrappingInputRule({
          find: /^\$callout\s*(.*)?\s$/,
          type: this.type,
          getAttributes: (match) => ({ emoji: match[1]?.trim() || '💡' }),
        }),
      ]
    },

    addNodeView() {
      return ReactNodeViewRenderer(component)
    },
  })
