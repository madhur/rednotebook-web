import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isToday } from 'date-fns'
import { useMonthSummary } from '../hooks/useEntry'
import { useNavigationStore } from '../store/navigation'

const DAY_HEADERS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

export function Calendar() {
  const { currentDate, setCurrentDate } = useNavigationStore()
  const [viewDate, setViewDate] = useState(() => new Date(currentDate.getFullYear(), currentDate.getMonth(), 1))

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth() + 1
  const { data: monthSummary } = useMonthSummary(year, month)
  const daysWithEntries = new Set(monthSummary?.days_with_entries ?? [])

  const monthStart = startOfMonth(viewDate)
  const monthEnd = endOfMonth(viewDate)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startOffset = getDay(monthStart) // 0 = Sunday

  const prevMonth = () => {
    setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))
  }

  const handleDayClick = (date: Date) => {
    setCurrentDate(date)
    // Sync view month to selected date's month
    setViewDate(new Date(date.getFullYear(), date.getMonth(), 1))
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={prevMonth}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
          {format(viewDate, 'MMMM yyyy')}
        </span>
        <button
          onClick={nextMonth}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_HEADERS.map(h => (
          <div key={h} className="text-center text-xs font-medium text-gray-400 dark:text-gray-500 py-1">
            {h}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-y-1">
        {/* Empty cells for offset */}
        {Array.from({ length: startOffset }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {days.map(date => {
          const dayNum = date.getDate()
          const hasEntry = daysWithEntries.has(dayNum)
          const isSelected = isSameDay(date, currentDate)
          const isTodayDate = isToday(date)

          return (
            <button
              key={dayNum}
              onClick={() => handleDayClick(date)}
              className={`
                relative flex flex-col items-center justify-center rounded-md text-xs py-1 transition-colors
                ${isSelected
                  ? 'bg-red-600 text-white font-bold'
                  : isTodayDate
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-semibold'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }
              `}
            >
              {dayNum}
              {hasEntry && !isSelected && (
                <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-red-500 dark:bg-red-400" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
