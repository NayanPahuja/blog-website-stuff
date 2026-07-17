'use client'

import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react'

export function VideoNodeView(props: NodeViewProps) {
  const { node, selected, editor } = props

  return (
    <NodeViewWrapper className="video-node-view relative" data-align={node.attrs.align}>
      <video
        controls
        preload="none"
        playsInline
        src={node.attrs.src}
        className={`max-w-full ${selected ? 'ring-2 ring-primary' : ''}`}
        style={{
          width: node.attrs.width || '100%',
          height: node.attrs.height || undefined,
        }}
        onClick={() => editor.commands.setNodeSelection(props.getPos())}
      />
    </NodeViewWrapper>
  )
}
