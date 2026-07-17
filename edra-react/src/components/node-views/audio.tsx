'use client'

import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react'

export function AudioNodeView(props: NodeViewProps) {
  const { node, selected, editor } = props

  return (
    <NodeViewWrapper className="audio-node-view relative" data-align={node.attrs.align}>
      <audio
        controls
        preload="none"
        src={node.attrs.src}
        className={`w-full ${selected ? 'ring-2 ring-primary' : ''}`}
        style={{ width: '100%' }}
        onClick={() => editor.commands.setNodeSelection(props.getPos())}
      />
    </NodeViewWrapper>
  )
}
