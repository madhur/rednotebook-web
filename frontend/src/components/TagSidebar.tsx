import { useTags } from '../hooks/useEntry'
import { Hash } from 'lucide-react'

interface Props {
  onTagClick: (tag: string) => void
}

export function TagSidebar({ onTagClick }: Props) {
  const { data: tags, isLoading } = useTags()

  if (isLoading) {
    return <div className="text-xs text-gray-400 px-2">Loading tags...</div>
  }

  if (!tags || tags.length === 0) {
    return <div className="text-xs text-gray-400 px-2 italic">No tags yet</div>
  }

  return (
    <div className="space-y-1">
      {tags.slice(0, 30).map(({ tag, count }) => (
        <button
          key={tag}
          onClick={() => onTagClick(tag)}
          className="flex items-center justify-between w-full text-left px-2 py-1 rounded text-sm hover:bg-gray-100 dark:hover:bg-gray-700 group"
        >
          <span className="flex items-center gap-1 text-gray-700 dark:text-gray-300 truncate">
            <Hash size={12} className="text-red-500 flex-shrink-0" />
            <span className="truncate">{tag}</span>
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500 ml-1 flex-shrink-0">
            {count}
          </span>
        </button>
      ))}
    </div>
  )
}
