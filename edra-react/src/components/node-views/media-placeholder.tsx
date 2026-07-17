'use client'

import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react'
import { useCallback, useRef, useState } from 'react'
import { Image, Video, AudioLines, CodeXml, Upload, Link2 } from 'lucide-react'

const MEDIA_TYPES = [
  { value: 'image' as const, icon: Image, label: 'Image' },
  { value: 'video' as const, icon: Video, label: 'Video' },
  { value: 'audio' as const, icon: AudioLines, label: 'Audio' },
  { value: 'iframe' as const, icon: CodeXml, label: 'Iframe' },
]

export function MediaPlaceholderNodeView(props: NodeViewProps) {
  const [tab, setTab] = useState<'upload' | 'embed'>('upload')
  const [url, setUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { node, editor } = props
  const mediaType = node.attrs.mediaType as 'image' | 'video' | 'audio' | 'iframe'

  const handleFileUpload = useCallback(
    async (file: File) => {
      setUploading(true)
      try {
        const onUpload = editor.storage.mediaPlaceholder?.onUpload
        if (onUpload) {
          const src = await onUpload(file)
          if (mediaType === 'audio') editor.commands.setAudio({ src })
          else if (mediaType === 'video') editor.commands.setVideo({ src })
          else editor.commands.setImage({ src })
        }
      } catch (err) {
        console.error('Upload failed:', err)
      } finally {
        setUploading(false)
      }
    },
    [editor, mediaType]
  )

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFileUpload(file)
    },
    [handleFileUpload]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const file = e.dataTransfer.files?.[0]
      if (file) handleFileUpload(file)
    },
    [handleFileUpload]
  )

  const handleEmbed = useCallback(() => {
    if (!url.trim()) return
    if (mediaType === 'audio') editor.commands.setAudio({ src: url })
    else if (mediaType === 'video') editor.commands.setVideo({ src: url })
    else if (mediaType === 'iframe') editor.commands.setIframe({ src: url })
    else editor.commands.setImage({ src: url })
  }, [url, mediaType, editor])

  const currentMedia = MEDIA_TYPES.find((m) => m.value === mediaType) || MEDIA_TYPES[0]
  const Icon = currentMedia.icon

  return (
    <NodeViewWrapper className="media-placeholder-node-view">
      <div
        className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('button, input, a')) return
          props.editor.commands.setNodeSelection(props.getPos())
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
          accept={mediaType === 'image' ? 'image/*' : mediaType === 'video' ? 'video/*' : mediaType === 'audio' ? 'audio/*' : undefined}
        />

        <div className="flex justify-center gap-2 mb-4">
          {MEDIA_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={(e) => {
                e.stopPropagation()
                props.updateAttributes({ mediaType: type.value })
              }}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm transition-colors ${
                mediaType === type.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
              contentEditable={false}
            >
              <type.icon className="h-4 w-4" />
              {type.label}
            </button>
          ))}
        </div>

        <div className="flex justify-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setTab('upload')
              fileInputRef.current?.click()
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
            contentEditable={false}
            disabled={uploading}
          >
            <Upload className="h-4 w-4" />
            {uploading ? 'Uploading...' : 'Upload'}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation()
              setTab('embed')
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm ${
              tab === 'embed' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
            contentEditable={false}
          >
            <Link2 className="h-4 w-4" />
            Embed Link
          </button>
        </div>

        {tab === 'embed' && (
          <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter URL..."
              className="flex-1 px-3 py-1.5 text-sm bg-background border rounded-md"
              onKeyDown={(e) => e.key === 'Enter' && handleEmbed()}
            />
            <button
              onClick={handleEmbed}
              className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm"
              contentEditable={false}
            >
              Insert
            </button>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  )
}
