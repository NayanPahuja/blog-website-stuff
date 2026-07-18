'use client'

import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import { Check, Code, Columns2, Copy, Download, Eye, Pencil, TriangleAlert, Workflow } from 'lucide-react'
import { cn } from '../../lib/cn'

let mermaidPromise: Promise<typeof import('mermaid')> | null = null
function loadMermaid() {
  if (!mermaidPromise) mermaidPromise = import('mermaid')
  return mermaidPromise
}

async function renderMermaid(
  target: HTMLDivElement | null,
  source: string,
  onResult: (svg: string | null, error: string | null) => void
) {
  if (!target || !source.trim()) {
    onResult(null, null)
    return
  }

  const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`
  try {
    const mermaid = (await loadMermaid()).default
    const { svg, bindFunctions } = await mermaid.render(id, source)
    onResult(svg, null)
    // bindFunctions must run against the DOM node the svg is inserted into
    requestAnimationFrame(() => {
      if (target.querySelector('svg')) bindFunctions?.(target)
    })
  } catch (err) {
    document.getElementById(id)?.remove()
    onResult(null, (err as Error).message || 'Failed to render diagram')
  }
}

export function MermaidNodeView(props: NodeViewProps) {
  const code = props.node.textContent

  const [isEditing, setIsEditing] = useState(false)
  const [editCode, setEditCode] = useState('')
  const [mode, setMode] = useState<'both' | 'code' | 'preview'>('both')
  const [copied, setCopied] = useState(false)

  const [previewSvg, setPreviewSvg] = useState<string | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [editSvg, setEditSvg] = useState<string | null>(null)
  const [editError, setEditError] = useState<string | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const previewContainerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()
  const renderCounterRef = useRef(0)

  const debouncedRender = useCallback(
    (
      target: HTMLDivElement | null,
      source: string,
      onResult: (svg: string | null, error: string | null) => void,
      delay = 400
    ) => {
      clearTimeout(debounceRef.current)
      const thisRender = ++renderCounterRef.current
      debounceRef.current = setTimeout(() => {
        renderMermaid(target, source, (svg, error) => {
          if (thisRender !== renderCounterRef.current) return
          onResult(svg, error)
        })
      }, delay)
    },
    []
  )

  // Preview mode (not editing): render the committed node content
  useEffect(() => {
    if (isEditing) return
    debouncedRender(containerRef.current, code, (svg, error) => {
      setPreviewSvg(svg)
      setPreviewError(error)
    }, 300)
  }, [isEditing, code, debouncedRender])

  // Edit mode: render the in-progress draft
  useEffect(() => {
    if (!isEditing || (mode !== 'both' && mode !== 'preview')) return
    debouncedRender(previewContainerRef.current, editCode, (svg, error) => {
      setEditSvg(svg)
      setEditError(error)
    }, 500)
  }, [isEditing, mode, editCode, debouncedRender])

  useEffect(() => () => clearTimeout(debounceRef.current), [])

  const enterEditMode = useCallback(() => {
    if (!props.editor.isEditable) return
    setEditCode(code)
    setEditError(null)
    setIsEditing(true)
  }, [props.editor.isEditable, code])

  const handleSave = useCallback(() => {
    const trimmed = editCode.trim()
    const pos = props.getPos()
    if (typeof pos !== 'number') return

    if (!trimmed) {
      props.deleteNode()
    } else {
      props.editor
        .chain()
        .focus()
        .insertContentAt(
          { from: pos, to: pos + props.node.nodeSize },
          { type: 'mermaid', content: [{ type: 'text', text: trimmed }] }
        )
        .run()
    }
    setIsEditing(false)
  }, [editCode, props])

  const handleCancel = useCallback(() => {
    setIsEditing(false)
    setEditError(null)
  }, [])

  const handleEditorKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        handleCancel()
        return
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        handleSave()
        return
      }
      if (e.key === 'Tab') {
        e.preventDefault()
        const target = e.currentTarget
        const start = target.selectionStart
        const end = target.selectionEnd
        setEditCode(editCode.slice(0, start) + '  ' + editCode.slice(end))
        requestAnimationFrame(() => {
          target.selectionStart = target.selectionEnd = start + 2
        })
      }
    },
    [editCode, handleCancel, handleSave]
  )

  const copyCode = useCallback(() => {
    const source = isEditing ? editCode : code
    if (!source) return
    navigator.clipboard.writeText(source).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [isEditing, editCode, code])

  const downloadImage = useCallback(() => {
    const svgEl = containerRef.current?.querySelector('svg')
    if (!svgEl) return

    const svgString = new XMLSerializer().serializeToString(svgEl)
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)

    const rect = svgEl.getBoundingClientRect()
    const viewBoxWidth = (svgEl as unknown as SVGSVGElement).viewBox?.baseVal?.width
    const viewBoxHeight = (svgEl as unknown as SVGSVGElement).viewBox?.baseVal?.height
    const width = viewBoxWidth && viewBoxWidth > 0 ? viewBoxWidth : rect.width || 800
    const height = viewBoxHeight && viewBoxHeight > 0 ? viewBoxHeight : rect.height || 600
    const dpr = window.devicePixelRatio || 1

    const image = new Image()
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = width * dpr
      canvas.height = height * dpr
      const context = canvas.getContext('2d')
      if (!context) return
      context.scale(dpr, dpr)
      context.fillStyle = '#fff'
      context.fillRect(0, 0, width, height)
      context.drawImage(image, 0, 0, width, height)

      const pngUrl = canvas.toDataURL('image/png')
      const downloadLink = document.createElement('a')
      downloadLink.href = pngUrl
      downloadLink.download = 'mermaid-diagram.png'
      document.body.appendChild(downloadLink)
      downloadLink.click()
      document.body.removeChild(downloadLink)
      URL.revokeObjectURL(url)
    }
    image.src = url
  }, [])

  const lineCount = (isEditing ? editCode : code)?.split('\n').length ?? 0

  return (
    <NodeViewWrapper
      className="mermaid-node-view group relative my-4! flex w-full flex-col items-center overflow-hidden rounded-lg transition-all duration-200"
      data-align={props.node.attrs.align}
      contentEditable={false}
    >
      {isEditing ? (
        <div className="bg-background flex h-112 w-full flex-col overflow-hidden rounded-lg border">
          <div className="bg-muted/30 flex items-center justify-between border-b px-3 py-1.5">
            <div className="flex items-center gap-2">
              <Workflow className="text-primary size-3.5" />
              <span className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">
                Mermaid
              </span>
              <span className="text-muted-foreground/50 text-[10px]">{lineCount} lines</span>
            </div>
            <div className="flex items-center gap-1">
              <Tabs.Root value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
                <Tabs.List className="flex items-center gap-0.5 rounded-md bg-muted p-0.5">
                  <Tabs.Trigger
                    value="code"
                    className="rounded px-2 py-1 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    <Code className="size-3.5" />
                  </Tabs.Trigger>
                  <Tabs.Trigger
                    value="both"
                    className="rounded px-2 py-1 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    <Columns2 className="size-3.5" />
                  </Tabs.Trigger>
                  <Tabs.Trigger
                    value="preview"
                    className="rounded px-2 py-1 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    <Eye className="size-3.5" />
                  </Tabs.Trigger>
                </Tabs.List>
              </Tabs.Root>
              <button
                onClick={copyCode}
                title="Copy code"
                className="hover:bg-accent flex size-7 items-center justify-center rounded-md"
              >
                {copied ? <Check className="size-3.5 text-green-500" /> : <Copy className="size-3.5" />}
              </button>
              <div className="bg-border mx-1 h-4 w-px" />
              <button
                onClick={handleCancel}
                className="hover:bg-accent rounded-md px-2 py-1 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="bg-primary text-primary-foreground rounded-md px-2 py-1 text-sm"
              >
                Apply
              </button>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 overflow-hidden">
            {(mode === 'both' || mode === 'code') && (
              <div className={cn('relative min-h-0 flex-1', mode === 'both' ? 'border-r' : '')}>
                <textarea
                  value={editCode}
                  onChange={(e) => setEditCode(e.target.value)}
                  onKeyDown={handleEditorKeyDown}
                  placeholder={'graph TD\n  A[Start] --> B[End]'}
                  spellCheck={false}
                  className="bg-muted/20 text-foreground placeholder:text-muted-foreground/40 size-full resize-none border-none p-4 font-mono text-[13px] leading-relaxed outline-none"
                />
                <div className="text-muted-foreground/50 absolute right-2 bottom-2 flex items-center gap-2 text-[9px]">
                  <span>⌘↵ Apply</span>
                  <span>Esc Cancel</span>
                </div>
              </div>
            )}
            {(mode === 'both' || mode === 'preview') && (
              <div className="bg-background relative flex min-h-0 flex-1 items-center justify-center overflow-auto p-6">
                {editError ? (
                  <div className="flex max-w-xs flex-col items-center gap-2 text-center">
                    <div className="bg-destructive/10 flex size-8 items-center justify-center rounded-lg">
                      <TriangleAlert className="text-destructive size-4" />
                    </div>
                    <p className="text-destructive text-xs font-medium">Syntax Error</p>
                    <p className="text-muted-foreground max-h-24 overflow-auto font-mono text-[10px] leading-relaxed">
                      {editError}
                    </p>
                  </div>
                ) : (
                  <div
                    ref={previewContainerRef}
                    className="mermaid-preview flex items-center justify-center [&_svg]:h-auto [&_svg]:max-w-full"
                    dangerouslySetInnerHTML={editSvg ? { __html: editSvg } : undefined}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="group/preview relative w-full">
          {!code || code.trim() === '' ? (
            <button
              onClick={enterEditMode}
              className="border-muted-foreground/30 bg-muted/30 hover:bg-muted/50 flex min-h-14 w-full items-center gap-2 rounded-lg border border-dashed p-4 transition-colors"
            >
              <Workflow className="text-muted-foreground size-4" />
              <span className="text-muted-foreground text-sm">Click to add a Mermaid diagram</span>
            </button>
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <div
                ref={containerRef}
                className="mermaid-container flex min-h-24 w-full items-center justify-center overflow-x-auto p-6 [&_svg]:mx-auto [&_svg]:h-auto [&_svg]:max-w-full"
                dangerouslySetInnerHTML={previewSvg ? { __html: previewSvg } : undefined}
              />
              {previewError && (
                <div className="bg-destructive/5 flex items-center gap-2 border-t px-4 py-2">
                  <TriangleAlert className="text-destructive size-3.5 shrink-0" />
                  <p className="text-destructive truncate text-xs">{previewError}</p>
                </div>
              )}
            </div>
          )}
          {props.editor.isEditable && code && code.trim() !== '' && (
            <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 transition-opacity group-hover/preview:opacity-100">
              <button
                onClick={downloadImage}
                title="Download Image"
                className="text-muted-foreground hover:bg-accent flex size-7 items-center justify-center rounded-md"
              >
                <Download className="size-3.5" />
              </button>
              <button
                onClick={copyCode}
                title="Copy code"
                className="text-muted-foreground hover:bg-accent flex size-7 items-center justify-center rounded-md"
              >
                {copied ? <Check className="size-3.5 text-green-500" /> : <Copy className="size-3.5" />}
              </button>
              <button
                onClick={enterEditMode}
                title="Edit diagram"
                className="text-muted-foreground hover:bg-accent flex size-7 items-center justify-center rounded-md"
              >
                <Pencil className="size-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </NodeViewWrapper>
  )
}
