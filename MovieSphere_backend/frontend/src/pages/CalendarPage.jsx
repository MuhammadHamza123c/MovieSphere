import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import client from '../api/client'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const WEEKDAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

export default function CalendarPage() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    client.get('/MovieSphere/calendar', { params: { month, year } })
      .then(({ data: d }) => {
        setData(d.MovieSphere)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [month, year])

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }
  const today = () => { const n = new Date(); setMonth(n.getMonth() + 1); setYear(n.getFullYear()) }

  const firstDay = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()

  const releaseDays = new Set((data?.days || []).map(d => parseInt(d.date.slice(8))))
  const dayItems = {}
  ;(data?.days || []).forEach(d => { dayItems[parseInt(d.date.slice(8))] = d.items })

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold text-gray-100">Content Calendar</h1>
        <div className="flex items-center gap-3">
          <button onClick={today} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 transition-all cursor-pointer border-0">
            Today
          </button>
          <div className="flex items-center gap-1">
            <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--bg-tertiary)] text-gray-400 hover:text-gray-200 hover:bg-gray-700/50 transition-all cursor-pointer border-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <span className="text-base font-bold text-gray-100 w-40 text-center">{MONTHS[month - 1]} {year}</span>
            <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--bg-tertiary)] text-gray-400 hover:text-gray-200 hover:bg-gray-700/50 transition-all cursor-pointer border-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-primary)] overflow-hidden">
          <div className="grid grid-cols-7">
            {WEEKDAYS.map(d => (
              <div key={d} className="p-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-[var(--border-primary)] bg-[var(--bg-tertiary)]/30">
                {d}
              </div>
            ))}
            {cells.map((day, i) => (
              <div key={i} className={`min-h-[120px] sm:min-h-[150px] p-1.5 border-b border-r border-[var(--border-primary)] transition-colors ${
                day ? (releaseDays.has(day) ? 'bg-indigo-500/[0.04]' : 'hover:bg-[var(--bg-tertiary)]/30') : 'bg-transparent'
              }`}>
                {day && (
                  <>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-bold ${releaseDays.has(day) ? 'text-indigo-400' : 'text-gray-500'}`}>
                        {day}
                      </span>
                      {releaseDays.has(day) && (
                        <span className="text-[9px] text-indigo-400/60 font-medium">{dayItems[day].length}</span>
                      )}
                    </div>
                    {releaseDays.has(day) && (
                      <div className="grid grid-cols-2 gap-1">
                        {dayItems[day]?.slice(0, 6).map((item, j) => (
                          <Link key={j} to={`/detail/${item.media_type}/${item.id}`} className="block group">
                            <div className="aspect-[2/3] rounded-md overflow-hidden border border-[var(--border-primary)] hover:border-indigo-400/60 transition-all bg-gray-800 relative">
                              {item.poster ? (
                                <img src={item.poster} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" loading="lazy" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-600">N/A</div>
                              )}
                              <div className="absolute top-0.5 right-0.5">
                                <span className={`px-1 py-[1px] rounded-sm text-[7px] font-bold uppercase ${item.media_type === 'movie' ? 'bg-indigo-500/90 text-white' : 'bg-emerald-500/90 text-white'}`}>
                                  {item.media_type === 'movie' ? 'M' : 'TV'}
                                </span>
                              </div>
                            </div>
                          </Link>
                        ))}
                        {dayItems[day]?.length > 6 && (
                          <Link to={`/upcoming`} className="aspect-[2/3] rounded-md overflow-hidden bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center hover:bg-indigo-500/25 transition-colors">
                            <span className="text-xs font-bold text-indigo-300">+{dayItems[day].length - 6}</span>
                          </Link>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
