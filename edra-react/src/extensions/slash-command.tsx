import { commands, type EdraCommand } from '../commands'
import { autoUpdate, computePosition, flip, offset, type Placement } from '@floating-ui/dom'
import { Extension } from '@tiptap/core'
import { EditorState, PluginKey } from '@tiptap/pm/state'
import Suggestion, { type SuggestionKeyDownProps, type SuggestionProps } from '@tiptap/suggestion'
import type { Editor } from '@tiptap/core'
import type { ComponentType } from 'react'
import { createRoot, type Root } from 'react-dom/client'

interface Group {
  name: string
  title: string
  actions: EdraCommand[]
}

const GROUPS: Group[] = [
  {
    name: 'format',
    title: 'Format',
    actions: [
      ...commands.headings,
      {
        icon: null as any,
        name: 'blockquote',
        tooltip: 'Blockquote',
        onClick: (editor: Editor) => {
          editor.chain().focus().setBlockquote().run()
        },
      },
      {
        icon: null as any,
        name: 'codeBlock',
        tooltip: 'Code Block',
        onClick: (editor: Editor) => {
          editor.chain().focus().setCodeBlock().run()
        },
      },
      ...commands.lists,
    ],
  },
  {
    name: 'insert',
    title: 'Insert',
    actions: [
      ...commands.media,
      ...commands.table,
      ...commands.math,
      ...commands.diagram,
      {
        icon: null as any,
        name: 'horizontalRule',
        tooltip: 'Horizontal Rule',
        onClick: (editor: Editor) => {
          editor.chain().focus().setHorizontalRule().run()
        },
      },
      {
        icon: null as any,
        name: 'callOut',
        tooltip: 'Callout',
        onClick: (editor: Editor) => {
          editor.commands.setCallout()
        },
      },
    ],
  },
]

const extensionName = 'slashCommand'

export interface SlashCommandPopupProps {
  items: { name: string; title: string; commands: EdraCommand[] }[]
  selectedGroupIdx: number
  selectedCommandIdx: number
  onHover: (groupIdx: number, commandIdx: number) => void
  command: (item: EdraCommand) => void
}

type FilteredGroup = { name: string; title: string; commands: EdraCommand[] }

function flattenItems(items: FilteredGroup[]): EdraCommand[] {
  return items.flatMap((g) => g.commands)
}

function clampMove(
  items: FilteredGroup[],
  groupIdx: number,
  commandIdx: number,
  delta: 1 | -1
): [number, number] {
  const flat = flattenItems(items)
  const current = items[groupIdx]?.commands[commandIdx]
  const currentFlatIdx = flat.indexOf(current as EdraCommand)
  const nextFlatIdx = currentFlatIdx + delta
  if (nextFlatIdx < 0 || nextFlatIdx >= flat.length) return [groupIdx, commandIdx]

  let count = 0
  for (let gi = 0; gi < items.length; gi++) {
    for (let ci = 0; ci < items[gi].commands.length; ci++) {
      if (count === nextFlatIdx) return [gi, ci]
      count++
    }
  }
  return [groupIdx, commandIdx]
}

export default (MenuList: ComponentType<SlashCommandPopupProps>): Extension =>
  Extension.create({
    name: extensionName,
    priority: 200,

    addStorage() {
      return {
        rect: { width: 0, height: 0, left: 0, top: 0, right: 0, bottom: 0 },
        popupElement: null as HTMLElement | null,
        popupCleanup: null as (() => void) | null,
        root: null as Root | null,
        currentItems: [] as FilteredGroup[],
        selectedGroupIdx: 0,
        selectedCommandIdx: 0,
      }
    },

    onCreate() {
      const el = document.createElement('div')
      el.style.position = 'fixed'
      el.style.zIndex = '9999'
      el.style.maxWidth = '16rem'
      el.style.visibility = 'hidden'
      el.style.pointerEvents = 'none'
      el.className = 'slash-command-popup'
      document.body.appendChild(el)

      const root = createRoot(el)
      this.storage.popupElement = el
      this.storage.root = root
    },

    onDestroy() {
      this.storage.popupCleanup?.()
      this.storage.root?.unmount()
      this.storage.popupElement?.remove()
      this.storage.popupElement = null
      this.storage.root = null
      this.storage.popupCleanup = null
    },

    addProseMirrorPlugins() {
      const storage = this.storage
      const editor = this.editor

      return [
        Suggestion({
          editor: this.editor,
          char: '/',
          allowSpaces: true,
          pluginKey: new PluginKey(extensionName),
          allow: ({ state, range }: { state: EditorState; range: { from: number; to: number } }) => {
            const $from = state.doc.resolve(range.from)
            const afterContent = $from.parent.textContent?.substring(
              $from.parent.textContent?.indexOf('/')
            )
            const isValidAfterContent = !afterContent?.endsWith('  ')
            return isValidAfterContent
          },
          command: ({ editor, range, props }) => {
            editor.chain().focus().deleteRange(range).run()
            props.onClick?.(editor)
          },
          items: ({ query }: { query: string }) => {
            const queryNormalized = query.toLowerCase().trim()
            return GROUPS.map((group) => ({
              ...group,
              commands: group.actions.filter((item) =>
                item.tooltip!.toLowerCase().trim().includes(queryNormalized)
              ),
            })).filter((group) => group.commands.length > 0)
          },
          render: () => {
            let currentClientRect: (() => DOMRect | null) | null = null
            let contextElement: Element | null = null
            let currentRange: { from: number; to: number } | null = null

            const updatePosition = () => {
              if (!storage.popupElement || !currentClientRect) return
              const rect = currentClientRect()
              if (!rect) return

              const referenceElement = {
                getBoundingClientRect: () => rect,
                ...(contextElement ? { contextElement } : {}),
              }

              computePosition(referenceElement, storage.popupElement, {
                placement: 'bottom-start' as Placement,
                strategy: 'fixed',
                middleware: [offset({ mainAxis: 8, crossAxis: 16 }), flip({ fallbackPlacements: ['top-start', 'bottom-start'] })],
              }).then(({ x, y }: { x: number; y: number }) => {
                if (storage.popupElement) {
                  storage.popupElement.style.left = `${x}px`
                  storage.popupElement.style.top = `${y}px`
                }
              })
            }

            const runCommand = (item: EdraCommand) => {
              if (!currentRange) return
              editor.chain().focus().deleteRange(currentRange as any).run()
              item.onClick?.(editor)

              // view.focus() is a no-op when the contentEditable root already has DOM
              // focus, so it never resyncs the browser caret into a React node view
              // that just mounted (e.g. code block). A genuine blur+focus cycle forces
              // ProseMirror to recompute and apply the DOM selection once the node
              // view has had a frame to mount.
              requestAnimationFrame(() => {
                const view = editor.view
                view.dom.blur()
                view.focus()
              })
            }

            const renderPopup = () => {
              if (!storage.popupElement || !storage.root) return
              storage.root.render(
                <MenuList
                  items={storage.currentItems}
                  selectedGroupIdx={storage.selectedGroupIdx}
                  selectedCommandIdx={storage.selectedCommandIdx}
                  onHover={(gi: number, ci: number) => {
                    storage.selectedGroupIdx = gi
                    storage.selectedCommandIdx = ci
                    renderPopup()
                  }}
                  command={runCommand}
                />
              )
            }

            return {
              onStart: (props: SuggestionProps) => {
                currentClientRect = props.clientRect ?? null
                contextElement = props.editor.view.dom
                currentRange = props.range as any
                storage.currentItems = props.items as any
                storage.selectedGroupIdx = 0
                storage.selectedCommandIdx = 0

                if (storage.popupElement && storage.root) {
                  renderPopup()
                  storage.popupElement.style.visibility = 'visible'
                  storage.popupElement.style.pointerEvents = 'auto'
                  updatePosition()

                  if (currentClientRect) {
                    storage.popupCleanup = autoUpdate(
                      {
                        getBoundingClientRect: () => currentClientRect?.() || new DOMRect(),
                        ...(contextElement ? { contextElement } : {}),
                      },
                      storage.popupElement,
                      updatePosition
                    )
                  }
                }
              },

              onUpdate(props: SuggestionProps) {
                currentClientRect = props.clientRect ?? null
                contextElement = props.editor.view.dom
                currentRange = props.range as any
                storage.currentItems = props.items as any
                storage.selectedGroupIdx = 0
                storage.selectedCommandIdx = 0

                if (storage.popupElement && storage.root) {
                  renderPopup()
                  storage.popupElement.style.visibility = 'visible'
                  storage.popupElement.style.pointerEvents = 'auto'
                }

                updatePosition()

                if (currentClientRect) {
                  const rect = currentClientRect()
                  if (rect) storage.rect = rect
                }
              },

              onKeyDown(props: SuggestionKeyDownProps) {
                if (props.event.key === 'Escape') {
                  if (storage.popupElement) {
                    storage.popupElement.style.visibility = 'hidden'
                    storage.popupElement.style.pointerEvents = 'none'
                  }
                  return true
                }

                const items: FilteredGroup[] = storage.currentItems ?? []
                if (items.length === 0) return false

                switch (props.event.key) {
                  case 'ArrowDown':
                  case 'Tab': {
                    props.event.preventDefault()
                    const [gi, ci] = clampMove(
                      items,
                      storage.selectedGroupIdx,
                      storage.selectedCommandIdx,
                      props.event.shiftKey ? -1 : 1
                    )
                    storage.selectedGroupIdx = gi
                    storage.selectedCommandIdx = ci
                    renderPopup()
                    return true
                  }
                  case 'ArrowUp': {
                    props.event.preventDefault()
                    const [gi, ci] = clampMove(
                      items,
                      storage.selectedGroupIdx,
                      storage.selectedCommandIdx,
                      -1
                    )
                    storage.selectedGroupIdx = gi
                    storage.selectedCommandIdx = ci
                    renderPopup()
                    return true
                  }
                  case 'Enter': {
                    props.event.preventDefault()
                    const cmd = items[storage.selectedGroupIdx]?.commands[storage.selectedCommandIdx]
                    if (cmd) runCommand(cmd)
                    return true
                  }
                  default:
                    return false
                }
              },

              onExit() {
                if (storage.popupElement) {
                  storage.popupElement.style.visibility = 'hidden'
                  storage.popupElement.style.pointerEvents = 'none'
                }
                if (storage.popupCleanup) {
                  storage.popupCleanup()
                  storage.popupCleanup = null
                }
                currentClientRect = null
                contextElement = null
                currentRange = null
              },
            }
          },
        }),
      ]
    },
  })
