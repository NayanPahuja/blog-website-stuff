'use client'

import { NodeViewWrapper, NodeViewContent, type NodeViewProps } from '@tiptap/react'
import { useCallback, useMemo, useRef, useState } from 'react'
import * as Popover from '@radix-ui/react-popover'
import { Check, ChevronDown, Copy, Sparkle } from 'lucide-react'
import { cn } from '../../lib/cn'
import strings from '../../lib/strings'

export function CodeBlock(props: NodeViewProps) {
  const [copied, setCopied] = useState(false)
  const [langMenuOpen, setLangMenuOpen] = useState(false)
  const [search, setSearch] = useState('')
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  const language: string = props.node.attrs.language || strings.extension.code.plainText

  const languages: string[] = useMemo(() => {
    const lowlight = props.extension.options.lowlight
    return lowlight ? [...lowlight.listLanguages()].sort() : []
  }, [props.extension])

  const filteredLanguages = useMemo(
    () => languages.filter((lang) => lang.toLowerCase().includes(search.toLowerCase().trim())),
    [languages, search]
  )

  const changeLanguage = useCallback(
    (lang: string) => {
      props.updateAttributes({ language: lang })
      setLangMenuOpen(false)
      setSearch('')
    },
    [props]
  )

  const convertToMermaid = useCallback(() => {
    const code = props.node.textContent
    const pos = props.getPos()
    if (typeof pos !== 'number') return
    props.editor
      .chain()
      .focus()
      .deleteRange({ from: pos, to: pos + props.node.nodeSize })
      .insertContentAt(pos, { type: 'mermaid', content: [{ type: 'text', text: code || '' }] })
      .run()
  }, [props])

  const handleCopy = useCallback(() => {
    const text = props.node.textContent
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setCopied(false), 2000)
    })
  }, [props.node.textContent])

  return (
    <NodeViewWrapper className="code-block relative group my-4 rounded-lg bg-muted dark:bg-muted/20">
      <div
        className="flex items-center justify-between px-2 py-1 text-xs text-muted-foreground"
        contentEditable={false}
      >
        <div className="flex items-center gap-1">
          {language.toLowerCase() === 'mermaid' && (
            <button
              onClick={convertToMermaid}
              title="Convert to Mermaid Diagram"
              className="flex items-center gap-1 rounded-md px-2 py-1 transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Sparkle className="h-3.5 w-3.5" />
            </button>
          )}
          <Popover.Root
            open={langMenuOpen}
            onOpenChange={(v) => {
              setLangMenuOpen(v)
              if (!v) setSearch('')
            }}
          >
            <Popover.Trigger asChild>
              <button
                disabled={!props.editor.isEditable}
                className="flex items-center gap-1 rounded-md px-2 py-1 capitalize transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                {language}
                <ChevronDown className="h-3 w-3" />
              </button>
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content
                side="top"
                align="start"
                className="z-50 flex max-h-72 w-44 flex-col overflow-hidden rounded-lg border bg-popover p-0 text-popover-foreground shadow-md"
                onOpenAutoFocus={(e) => e.preventDefault()}
                onCloseAutoFocus={(e) => e.preventDefault()}
              >
                <input
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={strings.extension.code.searchLanguagePlaceholder}
                  className="border-b bg-transparent px-2 py-1.5 text-sm outline-none"
                />
                <div className="max-h-60 overflow-y-auto p-1">
                  {filteredLanguages.length === 0 ? (
                    <div className="px-2 py-1.5 text-xs text-muted-foreground">
                      {strings.extension.code.searchLanguageEmpty}
                    </div>
                  ) : (
                    filteredLanguages.map((lang) => (
                      <button
                        key={lang}
                        onClick={() => changeLanguage(lang)}
                        className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm capitalize hover:bg-accent hover:text-accent-foreground"
                      >
                        <Check className={cn('h-3.5 w-3.5 shrink-0', lang !== language && 'invisible')} />
                        {lang}
                      </button>
                    ))
                  )}
                </div>
                <Popover.Arrow className="fill-popover" />
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
        </div>
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
      <pre className="px-4 pb-4">
        <NodeViewContent<'code'> as="code" />
      </pre>
    </NodeViewWrapper>
  )
}
