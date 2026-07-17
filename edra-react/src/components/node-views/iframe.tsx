'use client'

import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react'

export function IFrameNodeView(props: NodeViewProps) {
  const { node, selected, editor } = props

  return (
    <NodeViewWrapper className="iframe-node-view relative" data-align={node.attrs.align}>
      <div
        className={`iframe-wrapper ${selected ? 'ring-2 ring-primary' : ''}`}
        onClick={() => editor.commands.setNodeSelection(props.getPos())}
      >
        <iframe
          src={node.attrs.src}
          width={node.attrs.width || '100%'}
          height={node.attrs.height || undefined}
          title={node.attrs.title || undefined}
          allowFullScreen
          className="w-full"
          style={{ border: 0 }}
        />
      </div>
    </NodeViewWrapper>
  )
}
