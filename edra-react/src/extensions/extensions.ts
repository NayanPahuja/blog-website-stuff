import type { Extensions } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import { CharacterCount, Placeholder } from '@tiptap/extensions'
import strings from '../lib/strings'
import Highlight from '@tiptap/extension-highlight'
import { Color, FontSize, TextStyle } from '@tiptap/extension-text-style'
import Typography from '@tiptap/extension-typography'
import Subscript from '@tiptap/extension-subscript'
import TextAlign from '@tiptap/extension-text-align'
import SuperScript from '@tiptap/extension-superscript'
import { ColorHighlighter, Table, TableCell, TableHeader, TableRow, Audio } from './index'
import { TaskItem, TaskList } from '@tiptap/extension-list'
import { Markdown } from '@tiptap/markdown'
import Mathematics from '@tiptap/extension-mathematics'

export default [
  StarterKit.configure({
    orderedList: { HTMLAttributes: { class: 'list-decimal' } },
    bulletList: { HTMLAttributes: { class: 'list-disc' } },
    heading: { levels: [1, 2, 3, 4] },
    link: {
      openOnClick: false,
      autolink: true,
      linkOnPaste: true,
      HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer nofollow' },
    },
    codeBlock: false,
  }),
  Audio,
  CharacterCount,
  Highlight.configure({ multicolor: true }),
  Placeholder.configure({
    emptyEditorClass: 'is-empty',
    placeholder: ({ node }) => {
      if (node.type.name === 'heading') return strings.editor.headingPlaceholder
      if (node.type.name === 'paragraph') return strings.editor.paragraphPlaceholder
      return ''
    },
  }),
  Color,
  Subscript,
  SuperScript,
  Typography,
  ColorHighlighter,
  TextStyle,
  FontSize,
  TextAlign.configure({ types: ['heading', 'paragraph'] }),
  TaskList,
  TaskItem.configure({ nested: true }),
  Table,
  TableHeader,
  TableRow,
  TableCell,
  Markdown,
  Mathematics.configure({
    katexOptions: {
      throwOnError: true,
      macros: {
        '\\R': '\\mathbb{R}',
        '\\N': '\\mathbb{N}',
      },
    },
  }),
] as Extensions
