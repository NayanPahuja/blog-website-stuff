'use client'

import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react'
import { useCallback, useRef, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import strings from '../../lib/strings'

export function CodeBlock(props: NodeViewProps) {
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  const handleCopy = useCallback(() => {
    const text = props.node.textContent
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setCopied(false), 2000)
    })
  }, [props.node.textContent])

  return (
    <NodeViewWrapper className="code-block relative group">
      <div className="flex items-center justify-between bg-muted px-4 py-1.5 text-xs text-muted-foreground">
        <span>{props.node.attrs.language || strings.extension.code.plainText}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          {copied ? (
            <><Check className="h-3.5 w-3.5" />{strings.extension.code.copied}</>
          ) : (
            <><Copy className="h-3.5 w-3.5" />{strings.extension.code.copy}</>
          )}
        </button>
      </div>
      <pre><code><span contentEditable>{props.node.textContent}</span></code></pre>
    </NodeViewWrapper>
  )
}
