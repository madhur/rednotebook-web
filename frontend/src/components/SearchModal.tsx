import { useState, useEffect, useRef } from 'react'
import { Search, X, Calendar } from 'lucide-react'
import { useSearch } from '../hooks/useSearch'
import { useNavigationStore } from '../store/navigation'
import { format, parseISO } from 'date-fns'

interface Props {
  open: boolean
  onClose: () => void
}

export function SearchModal({ open, onClose }: Props) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const { setCurrentDate } = useNavigationStore()

  const { data: results, isLoading } = useSearch(query, undefined, open)

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setQuery('')
    }
  }, [open])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  const handleResultClick = (dateStr: string) => {
    setCurrentDate(parseISO(dateStr))
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <Search size={18} className="text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search journal entries..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="flex-1 text-sm bg-transparent outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400"
          />
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X size={18} />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {isLoading && (
            <div className="px-4 py-8 text-center text-sm text-gray-400">Searching...</div>
          )}
          {!isLoading && query.length > 1 && results?.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-gray-400">No results found for "{query}"</div>
          )}
          {!isLoading && query.length <= 1 && (
            <div className="px-4 py-8 text-center text-sm text-gray-400">Type at least 2 characters to search</div>
          )}
          {results && results.length > 0 && (
            <ul>
              {results.map(result => (
                <li key={result.date}>
                  <button
                    onClick={() => handleResultClick(result.date)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-0 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar size={14} className="text-red-500 flex-shrink-0" />
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {format(parseISO(result.date), 'EEEE, MMMM d, yyyy')}
                      </span>
                      {result.tags.length > 0 && (
                        <div className="flex gap-1 ml-auto">
                          {result.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="text-xs px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{result.snippet}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
