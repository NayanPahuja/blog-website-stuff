'use client'

import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react'

export function ImageNodeView(props: NodeViewProps) {
  const { node, selected, editor } = props

  return (
    <NodeViewWrapper className="image-node-view relative inline-block" data-align={node.attrs.align}>
      <img
        src={node.attrs.src}
        alt={node.attrs.alt || ''}
        title={node.attrs.title || undefined}
        className={`max-w-full h-auto cursor-pointer ${selected ? 'ring-2 ring-primary' : ''}`}
        style={{
          width: node.attrs.width || '100%',
          height: node.attrs.height || undefined,
          display: 'block',
          marginLeft: node.attrs.align === 'center' ? 'auto' : node.attrs.align === 'right' ? 'auto' : '0',
          marginRight: node.attrs.align === 'center' ? 'auto' : node.attrs.align === 'left' ? 'auto' : '0',
        }}
        onClick={() => editor.commands.setNodeSelection(props.getPos())}
        draggable
      />
    </NodeViewWrapper>
  )
}
