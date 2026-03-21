import { useEffect, useState } from 'react'
import { api } from '../api'

interface Props {
  text: string
}

export function Preview({ text }: Props) {
  const [html, setHtml] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!text.trim()) {
      setHtml('<p class="text-gray-400 italic">Nothing to preview yet.</p>')
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const result = await api.renderMarkup(text)
        setHtml(result)
      } catch {
        setHtml('<p class="text-red-500">Preview failed to render.</p>')
      } finally {
        setLoading(false)
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [text])

  return (
    <div className="h-full overflow-auto p-4 relative">
      {loading && (
        <div className="absolute top-2 right-2 text-xs text-gray-400">Rendering...</div>
      )}
      <div
        className="journal-preview prose max-w-none"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}
