import { mergeAttributes, Node } from '@tiptap/core'
import { Plugin } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import strings from '../../lib/strings'
import { getCellsInColumn, isRowSelected, selectRow } from './utils'

export interface TableCellOptions {
  HTMLAttributes: Record<string, unknown>
}

export const TableCell = Node.create<TableCellOptions>({
  name: 'tableCell',
  content: 'block+',
  tableRole: 'cell',
  isolating: true,

  addOptions() {
    return { HTMLAttributes: {} }
  },

  parseHTML() {
    return [{ tag: 'td' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['td', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0]
  },

  addAttributes() {
    return {
      colspan: { default: 1, parseHTML: (element) => Number.parseInt(element.getAttribute('colspan')!, 10) || 1 },
      rowspan: { default: 1, parseHTML: (element) => Number.parseInt(element.getAttribute('rowspan')!, 10) || 1 },
      colwidth: {
        default: null,
        parseHTML: (element) => {
          const colwidth = element.getAttribute('colwidth')
          return colwidth ? [Number.parseInt(colwidth, 10)] : null
        },
      },
      style: { default: null },
    }
  },

  addProseMirrorPlugins() {
    const { isEditable } = this.editor

    return [
      new Plugin({
        props: {
          decorations: (state) => {
            if (!isEditable) return DecorationSet.empty

            const { doc, selection } = state
            const decorations: Decoration[] = []
            const firstColCells = getCellsInColumn(0)(selection)

            if (firstColCells) {
              firstColCells.forEach(({ pos }: { pos: number }, index: number) => {
                decorations.push(
                  Decoration.widget(pos + 1, () => {
                    const rowSelected = isRowSelected(index)(selection)
                    let className = 'grip-row'
                    if (rowSelected) className += ' selected'
                    if (index === 0) className += ' first'
                    if (index === firstColCells.length - 1) className += ' last'

                    const grip = document.createElement('a')
                    grip.className = className
                    grip.setAttribute('role', 'button')
                    grip.setAttribute('aria-label', strings.extension.table.selectRow)
                    grip.setAttribute('tabindex', '0')
                    grip.dataset.rowIndex = String(index)
                    grip.addEventListener('mousedown', (event) => {
                      event.preventDefault()
                      event.stopImmediatePropagation()
                      this.editor.view.dispatch(selectRow(index)(this.editor.state.tr))
                    })
                    return grip
                  })
                )
              })

              if (firstColCells.length > 0) {
                const lastRowCell = firstColCells[firstColCells.length - 1]
                decorations.push(
                  Decoration.widget(lastRowCell.pos + 1, () => {
                    const btn = document.createElement('button')
                    btn.className = 'add-row-btn'
                    btn.type = 'button'
                    btn.setAttribute('aria-label', strings.extension.table.addRow)
                    btn.setAttribute('title', strings.extension.table.addRowAfter)
                    btn.textContent = '+'
                    btn.addEventListener('mousedown', (event) => {
                      event.preventDefault()
                      event.stopImmediatePropagation()
                      this.editor.view.dispatch(selectRow(firstColCells.length - 1)(this.editor.state.tr))
                      this.editor.chain().focus().addRowAfter().run()
                    })
                    return btn
                  })
                )
              }
            }

            return DecorationSet.create(doc, decorations)
          },
        },
      }),
      new Plugin({
        props: {
          handleDOMEvents: {
            mousemove: (view, event) => {
              const target = event.target as HTMLElement
              const cell = target.closest('td, th')
              const table = target.closest('table')
              if (!cell || !table) return false
              const rowIndex = (cell.parentElement as HTMLTableRowElement).rowIndex
              const grips = table.querySelectorAll<HTMLAnchorElement>('a.grip-row')
              grips.forEach((g, idx) => {
                if (idx === rowIndex) g.classList.add('show-row-grip')
                else g.classList.remove('show-row-grip')
              })
              const wrapper = table.closest('.tableWrapper')
              if (wrapper) {
                const lastIndex = table.rows.length ? table.rows.length - 1 : -1
                if (rowIndex === lastIndex) wrapper.classList.add('last-row-hover')
                else wrapper.classList.remove('last-row-hover')
              }
              return false
            },
            focusin: (view, event) => {
              const target = event.target as HTMLElement
              const cell = target.closest('td, th')
              const table = target.closest('table')
              if (!cell || !table) return false
              const rowIndex = (cell.parentElement as HTMLTableRowElement).rowIndex
              const grips = table.querySelectorAll<HTMLAnchorElement>('a.grip-row')
              grips.forEach((g, idx) => {
                if (idx === rowIndex) g.classList.add('show-row-grip')
                else g.classList.remove('show-row-grip')
              })
              const wrapper = table.closest('.tableWrapper')
              if (wrapper) {
                const lastIndex = table.rows.length ? table.rows.length - 1 : -1
                if (rowIndex === lastIndex) wrapper.classList.add('last-row-hover')
                else wrapper.classList.remove('last-row-hover')
              }
              return false
            },
            mousedown: (view, event) => {
              const target = event.target as HTMLElement
              const cell = target.closest('td, th')
              const table = target.closest('table')
              if (!cell || !table) return false
              const rowIndex = (cell.parentElement as HTMLTableRowElement).rowIndex
              const grips = table.querySelectorAll<HTMLAnchorElement>('a.grip-row')
              grips.forEach((g, idx) => {
                if (idx === rowIndex) g.classList.add('show-row-grip')
                else g.classList.remove('show-row-grip')
              })
              const wrapper = table.closest('.tableWrapper')
              if (wrapper) {
                const lastIndex = table.rows.length ? table.rows.length - 1 : -1
                if (rowIndex === lastIndex) wrapper.classList.add('last-row-hover')
                else wrapper.classList.remove('last-row-hover')
              }
              return false
            },
            mouseleave: (view, event) => {
              const table = (event.target as HTMLElement).closest('table')
              if (!table) return false
              const grips = table.querySelectorAll<HTMLAnchorElement>('a.grip-row')
              grips.forEach((g) => g.classList.remove('show-row-grip'))
              const wrapper = table.closest('.tableWrapper')
              if (wrapper) wrapper.classList.remove('last-row-hover')
              return false
            },
            mouseout: (view, event) => {
              const target = event.target as HTMLElement
              const table = target.closest('table')
              const to = (event as MouseEvent).relatedTarget as HTMLElement | null
              if (!table) return false
              if (!to || !to.closest('table') || to.closest('table') !== table) {
                const grips = table.querySelectorAll<HTMLAnchorElement>('a.grip-row')
                grips.forEach((g) => g.classList.remove('show-row-grip'))
                const wrapper = table.closest('.tableWrapper')
                if (wrapper) wrapper.classList.remove('last-row-hover')
              }
              return false
            },
            touchstart: (view, event) => {
              const target = (event as TouchEvent).target as HTMLElement
              const cell = target.closest('td, th')
              const table = target.closest('table')
              if (!cell || !table) return false
              const rowIndex = (cell.parentElement as HTMLTableRowElement).rowIndex
              const grips = table.querySelectorAll<HTMLAnchorElement>('a.grip-row')
              grips.forEach((g, idx) => {
                if (idx === rowIndex) g.classList.add('show-row-grip')
                else g.classList.remove('show-row-grip')
              })
              const wrapper = table.closest('.tableWrapper')
              if (wrapper) {
                const lastIndex = table.rows.length ? table.rows.length - 1 : -1
                if (rowIndex === lastIndex) wrapper.classList.add('last-row-hover')
                else wrapper.classList.remove('last-row-hover')
              }
              return false
            },
            touchmove: (view, event) => {
              const target = (event as TouchEvent).target as HTMLElement
              const cell = target.closest('td, th')
              const table = target.closest('table')
              if (!cell || !table) return false
              const rowIndex = (cell.parentElement as HTMLTableRowElement).rowIndex
              const grips = table.querySelectorAll<HTMLAnchorElement>('a.grip-row')
              grips.forEach((g, idx) => {
                if (idx === rowIndex) g.classList.add('show-row-grip')
                else g.classList.remove('show-row-grip')
              })
              const wrapper = table.closest('.tableWrapper')
              if (wrapper) {
                const lastIndex = table.rows.length ? table.rows.length - 1 : -1
                if (rowIndex === lastIndex) wrapper.classList.add('last-row-hover')
                else wrapper.classList.remove('last-row-hover')
              }
              return false
            },
          },
        },
      }),
    ]
  },
})
