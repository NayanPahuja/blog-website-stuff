import { mergeAttributes, Node } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import type { ComponentType } from 'react'
import { NodeSelection } from '@tiptap/pm/state'

export interface MediaPlaceholderOptions {
  HTMLAttributes: Record<string, unknown>
  onUpload?: (file: File) => Promise<string>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    mediaPlaceholder: {
      insertMediaPlaceholder: (options: { mediaType: 'image' | 'video' | 'audio' | 'iframe' }) => ReturnType
      setMediaUploadHandler: (handler: (file: File) => Promise<string>) => ReturnType
      uploadMedia: (file: File) => ReturnType
    }
  }
}

declare module '@tiptap/core' {
  interface Storage {
    mediaPlaceholder: {
      onUpload?: (file: File) => Promise<string>
    }
  }
}

export const MediaPlaceholder = (component: ComponentType<any>) =>
  Node.create<MediaPlaceholderOptions>({
    name: 'mediaPlaceholder',

    addOptions() {
      return { HTMLAttributes: {}, onUpload: undefined }
    },

    addStorage() {
      return { onUpload: this.options.onUpload }
    },

    addAttributes() {
      return {
        mediaType: {
          default: 'image',
          parseHTML: (element) => element.getAttribute('data-media-type'),
          renderHTML: (attributes) => {
            if (!attributes.mediaType) return {}
            return { 'data-media-type': attributes.mediaType }
          },
        },
      }
    },

    parseHTML() {
      return [{ tag: `div[data-type="${this.name}"]` }]
    },

    renderHTML({ HTMLAttributes }) {
      return ['div', mergeAttributes({ 'data-type': this.name }, this.options.HTMLAttributes, HTMLAttributes)]
    },

    group: 'block',
    draggable: true,
    atom: true,
    content: 'inline*',
    isolating: true,

    addNodeView() {
      return ReactNodeViewRenderer(component)
    },

    addCommands() {
      return {
        insertMediaPlaceholder:
          (options) =>
          ({ commands }) =>
            commands.insertContent({ type: this.name, attrs: { mediaType: options.mediaType } }),

        setMediaUploadHandler:
          (handler) =>
          ({ editor }) => {
            editor.storage.mediaPlaceholder.onUpload = handler
            return true
          },

        uploadMedia:
          (file: File) =>
          ({ editor }) => {
            const storage = editor.storage.mediaPlaceholder
            const onUpload = storage.onUpload || this.options.onUpload
            if (!onUpload) throw new Error('onUpload is not defined')

            let mediaType = 'image'
            const { selection } = editor.state
            if (selection instanceof NodeSelection) {
              const selectedNode = selection.node
              if (selectedNode.type.name === this.name) {
                mediaType = selectedNode.attrs.mediaType
              }
            }

            void onUpload(file)
              .then((src: string) => {
                editor.view.focus()
                if (mediaType === 'audio') editor.commands.setAudio({ src })
                else if (mediaType === 'video') editor.commands.setVideo({ src })
                else editor.commands.setImage({ src })
              })
              .catch((error: Error) => {
                console.error('Failed to upload media:', error)
              })

            return true
          },
      }
    },
  })
