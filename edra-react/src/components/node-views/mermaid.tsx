'use client'

import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react'
import { useEffect, useRef, useState } from 'react'

export function MermaidNodeView(props: NodeViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const code = props.node.textContent
    if (!code || code.trim() === '') return

    setError(null)
    containerRef.current.innerHTML = ''

    import('mermaid').then((mermaid) => {
      const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`
      mermaid.default
        .render(id, code)
        .then((result) => {
          if (containerRef.current) {
            containerRef.current.innerHTML = result.svg
          }
        })
        .catch((err) => {
          setError(err.message || 'Failed to render diagram')
        })
    })
  }, [props.node.textContent])

  return (
    <NodeViewWrapper className="mermaid-node-view relative" data-align={props.node.attrs.align}>
      {error && (
        <div className="bg-destructive/10 border border-destructive rounded p-2 text-sm text-destructive mb-2">
          {error}
        </div>
      )}
      <div
        ref={containerRef}
        className="mermaid-container p-4 bg-background rounded border cursor-pointer"
        onClick={() => props.editor.commands.setNodeSelection(props.getPos())}
      />
    </NodeViewWrapper>
  )
}
