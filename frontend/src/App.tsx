import { useState, useEffect, useCallback, useRef } from 'react'
import { format } from 'date-fns'
import { ChevronLeft, ChevronRight, Search, Book, Save, CheckCircle, Sun, Moon, Menu, X } from 'lucide-react'
import { useNavigationStore } from './store/navigation'
import { useEntry, useSaveEntry } from './hooks/useEntry'
import { Calendar } from './components/Calendar'
import { Editor } from './components/Editor'
import { Preview } from './components/Preview'
import { TagSidebar } from './components/TagSidebar'
import { CategoryPanel } from './components/CategoryPanel'
import { SearchModal } from './components/SearchModal'

export default function App() {
  const { currentDate, view, setView, goToPrevDay, goToNextDay, goToToday } = useNavigationStore()
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark')
  const [searchOpen, setSearchOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [savedRecently, setSavedRecently] = useState(false)
  const [localText, setLocalText] = useState('')
  const [localCategories, setLocalCategories] = useState<Record<string, string[]>>({})
  const [isDirty, setIsDirty] = useState(false)
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth() + 1
  const day = currentDate.getDate()

  const { data: entry, isLoading } = useEntry(year, month, day)
  const { mutate: saveEntry, isPending: isSaving } = useSaveEntry()

  // Sync loaded entry into local state; reset transient UI state on date change
  useEffect(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    if (entry) {
      setLocalText(entry.text)
      setLocalCategories(entry.categories)
    }
    setIsDirty(false)
    setSavedRecently(false)
  }, [entry?.date]) // Only reset when date changes

  // Dark mode toggle
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
  }, [isDark])

  const handleSave = useCallback(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    saveEntry(
      { year, month, day, entry: { text: localText, categories: localCategories } },
      {
        onSuccess: () => {
          setIsDirty(false)
          setSavedRecently(true)
          setTimeout(() => setSavedRecently(false), 2000)
        },
      }
    )
  }, [year, month, day, localText, localCategories, saveEntry])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault()
        setSearchOpen(true)
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleSave])

  const handleTextChange = (text: string) => {
    setLocalText(text)
    setIsDirty(true)
    // Auto-save after 2s of inactivity
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(() => handleSave(), 2000)
  }

  const handleTagClick = (_tag: string) => {
    setSearchOpen(true)
    // TODO: pre-fill search with tag
  }

  const formattedDate = format(currentDate, 'EEEE, MMMM d, yyyy')
  const formattedDateShort = format(currentDate, 'MMM d, yyyy')

  return (
    <div className={`h-screen flex flex-col bg-gray-50 dark:bg-gray-900 ${isDark ? 'dark' : ''}`}>
      {/* Top bar */}
      <header className="flex items-center gap-2 px-3 py-2 bg-red-700 text-white shadow-md flex-shrink-0">
        {/* Mobile sidebar toggle */}
        <button
          onClick={() => setSidebarOpen(o => !o)}
          className="md:hidden p-1.5 rounded hover:bg-red-800 transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>

        <div className="flex items-center gap-2">
          <Book size={20} />
          <span className="font-semibold text-lg tracking-tight">RedNotebook</span>
        </div>

        {/* Search bar */}
        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-2 flex-1 max-w-md px-3 py-1.5 bg-red-800/60 hover:bg-red-800 rounded-md text-sm text-red-200 transition-colors ml-2"
        >
          <Search size={14} />
          <span className="hidden sm:inline">Search entries...</span>
          <span className="hidden md:inline text-red-300 text-xs">(Ctrl+F)</span>
        </button>

        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => setIsDark(d => !d)}
            className="p-1.5 rounded hover:bg-red-800 transition-colors"
            title="Toggle dark mode"
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </header>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="absolute inset-0 z-20 bg-black/40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Left sidebar */}
        <aside className={`
          flex-shrink-0 flex flex-col gap-3 p-3 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto
          md:w-52 md:static md:z-auto md:translate-x-0
          absolute top-0 left-0 h-full z-30 w-72 transition-transform duration-200
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          {/* Mobile close button */}
          <div className="flex items-center justify-between md:hidden mb-1">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Navigation</span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
            >
              <X size={18} />
            </button>
          </div>

          <Calendar />
          <div>
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-2 mb-1">
              Tags
            </h3>
            <TagSidebar onTagClick={handleTagClick} />
          </div>
        </aside>

        {/* Editor area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Date navigation bar */}
          <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <button
              onClick={goToPrevDay}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={goToToday}
              className="flex-1 text-center font-semibold text-gray-800 dark:text-gray-100 text-sm hover:text-red-600 dark:hover:text-red-400 transition-colors min-w-0"
            >
              <span className="hidden sm:inline">{formattedDate}</span>
              <span className="sm:hidden">{formattedDateShort}</span>
            </button>
            <button
              onClick={goToNextDay}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
            >
              <ChevronRight size={18} />
            </button>

            {/* View toggle */}
            <div className="flex items-center border border-gray-200 dark:border-gray-600 rounded-md overflow-hidden ml-2">
              <button
                onClick={() => setView('edit')}
                className={`px-3 py-1 text-xs font-medium transition-colors ${
                  view === 'edit'
                    ? 'bg-red-600 text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                Edit
              </button>
              <button
                onClick={() => setView('preview')}
                className={`px-3 py-1 text-xs font-medium transition-colors ${
                  view === 'preview'
                    ? 'bg-red-600 text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                Preview
              </button>
            </div>

            {/* Save status */}
            <div className="ml-2">
              {savedRecently ? (
                <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                  <CheckCircle size={14} />
                  Saved
                </span>
              ) : isDirty ? (
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-1 text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                >
                  <Save size={12} />
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              ) : null}
            </div>
          </div>

          {/* Editor / Preview */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-sm">Loading...</div>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-hidden bg-white dark:bg-gray-900">
                  {view === 'edit' ? (
                    <Editor value={localText} onChange={handleTextChange} isDark={isDark} />
                  ) : (
                    <Preview text={localText} />
                  )}
                </div>

                {/* Categories panel */}
                <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 max-h-48 overflow-y-auto flex-shrink-0">
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                    Tags & Categories
                  </h3>
                  <CategoryPanel
                    categories={localCategories}
                    onChange={cats => { setLocalCategories(cats); setIsDirty(true) }}
                  />
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  )
}
