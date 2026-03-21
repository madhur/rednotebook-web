import { useState } from 'react'
import { Plus, X, ChevronDown, ChevronRight } from 'lucide-react'

interface Props {
  categories: Record<string, string[]>
  onChange: (categories: Record<string, string[]>) => void
}

export function CategoryPanel({ categories, onChange }: Props) {
  const [newCatName, setNewCatName] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [newEntry, setNewEntry] = useState<Record<string, string>>({})

  const toggleExpand = (cat: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(cat) ? next.delete(cat) : next.add(cat)
      return next
    })
  }

  const addCategory = () => {
    const name = newCatName.trim()
    if (!name || name in categories) return
    onChange({ ...categories, [name]: [] })
    setNewCatName('')
    setExpanded(prev => new Set([...prev, name]))
  }

  const removeCategory = (cat: string) => {
    const next = { ...categories }
    delete next[cat]
    onChange(next)
  }

  const addEntry = (cat: string) => {
    const entry = (newEntry[cat] ?? '').trim()
    if (!entry) return
    const existing = categories[cat] ?? []
    if (!existing.includes(entry)) {
      onChange({ ...categories, [cat]: [...existing, entry] })
    }
    setNewEntry(prev => ({ ...prev, [cat]: '' }))
  }

  const removeEntry = (cat: string, entry: string) => {
    onChange({ ...categories, [cat]: (categories[cat] ?? []).filter(e => e !== entry) })
  }

  return (
    <div className="space-y-2">
      {Object.entries(categories).map(([cat, entries]) => (
        <div key={cat} className="border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
          <div
            className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800 cursor-pointer"
            onClick={() => toggleExpand(cat)}
          >
            <div className="flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-300">
              {expanded.has(cat) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              {cat}
            </div>
            <button
              onClick={e => { e.stopPropagation(); removeCategory(cat) }}
              className="text-gray-400 hover:text-red-500 transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          {expanded.has(cat) && (
            <div className="px-3 py-2 space-y-1 bg-white dark:bg-gray-900">
              {entries.map(entry => (
                <div key={entry} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">• {entry}</span>
                  <button onClick={() => removeEntry(cat, entry)} className="text-gray-300 hover:text-red-500">
                    <X size={12} />
                  </button>
                </div>
              ))}
              <div className="flex gap-1 mt-1">
                <input
                  type="text"
                  placeholder="New entry..."
                  value={newEntry[cat] ?? ''}
                  onChange={e => setNewEntry(prev => ({ ...prev, [cat]: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && addEntry(cat)}
                  className="flex-1 text-xs px-2 py-1 border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
                <button
                  onClick={() => addEntry(cat)}
                  className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  <Plus size={12} />
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Add new category */}
      <div className="flex gap-1">
        <input
          type="text"
          placeholder="New category..."
          value={newCatName}
          onChange={e => setNewCatName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addCategory()}
          className="flex-1 text-xs px-2 py-1 border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-red-500"
        />
        <button
          onClick={addCategory}
          className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center gap-1"
        >
          <Plus size={12} />
          Category
        </button>
      </div>
    </div>
  )
}
