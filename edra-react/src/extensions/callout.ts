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

    // `token.tokens` here was always undefined — the custom tokenizer above
    // only ever sets `{type, raw, emoji, text}`, never `tokens`. That made
    // `helpers.parseChildren(token.tokens || [])` always parse an empty
    // array, so every callout loaded from markdown got zero paragraphs
    // (content: []) regardless of what text it actually contained — the
    // "text vanishes after saving" bug. Actually convert the captured
    // `token.text` into paragraph(s) using the real parse helpers instead.
    parseMarkdown: (token: any, helpers: any) => {
      const rawText = (token.text || '').trim()
      const paragraphs = rawText.length > 0 ? rawText.split(/\n{2,}/) : ['']
      return {
        type: 'callout',
        attrs: { emoji: token.emoji },
        content: paragraphs.map((paraText: string) => ({
          type: 'paragraph',
          content: helpers.parseInline(helpers.tokenizeInline(paraText)),
        })),
      }
    },

    renderMarkdown: (node: any, helpers: any) => {
      // Passing `node` itself (instead of its content array) here made
      // @tiptap/markdown's renderChildren() re-select this same callout
      // handler for its own children — infinite recursion, "Maximum call
      // stack size exceeded" on every save. Pass the paragraph array
      // directly so renderChildren dispatches to the paragraph handler.
      const children = Array.isArray(node.content) ? node.content : []
      const content = helpers.renderChildren(children)
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
