import { useEffect, useRef } from 'react'
import { EditorView, basicSetup } from 'codemirror'
import { EditorState, Compartment } from '@codemirror/state'
import { markdown } from '@codemirror/lang-markdown'
import { oneDark } from '@codemirror/theme-one-dark'

interface Props {
  value: string
  onChange: (value: string) => void
  isDark?: boolean
  fontSize?: number
}

const fontSizeCompartment = new Compartment()

function fontSizeTheme(size: number) {
  return EditorView.theme({ '&': { fontSize: `${size}px` } })
}

export function Editor({ value, onChange, isDark = false, fontSize = 18 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    if (!containerRef.current) return

    const view = new EditorView({
      state: EditorState.create({
        doc: value,
        extensions: [
          basicSetup,
          markdown(),
          isDark ? oneDark : [],
          EditorView.updateListener.of((update: import('@codemirror/view').ViewUpdate) => {
            if (update.docChanged) {
              onChangeRef.current(update.state.doc.toString())
            }
          }),
          EditorView.lineWrapping,
          EditorView.theme({
            '&': { height: '100%' },
            '.cm-scroller': { overflow: 'auto' },
          }),
          fontSizeCompartment.of(fontSizeTheme(fontSize)),
        ],
      }),
      parent: containerRef.current,
    })

    viewRef.current = view

    return () => {
      view.destroy()
      viewRef.current = null
    }
  }, [isDark]) // Only recreate on theme change

  // Update font size without recreating the editor
  useEffect(() => {
    viewRef.current?.dispatch({
      effects: fontSizeCompartment.reconfigure(fontSizeTheme(fontSize)),
    })
  }, [fontSize])

  // Sync external value changes without resetting cursor
  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    const current = view.state.doc.toString()
    if (current !== value) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
      })
    }
  }, [value])

  return <div ref={containerRef} className="h-full w-full" />
}
