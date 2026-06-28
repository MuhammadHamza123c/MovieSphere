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
        <>
          {/* Calendar grid */}
          <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-primary)] overflow-hidden mb-8">
            <div className="grid grid-cols-7">
              {WEEKDAYS.map(d => (
                <div key={d} className="p-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-[var(--border-primary)] bg-[var(--bg-tertiary)]/30">
                  {d}
                </div>
              ))}
              {cells.map((day, i) => (
                <div key={i} className={`min-h-[80px] sm:min-h-[100px] p-1.5 border-b border-r border-[var(--border-primary)] relative transition-colors ${
                  day ? (releaseDays.has(day) ? 'bg-indigo-500/5 hover:bg-indigo-500/10' : 'hover:bg-[var(--bg-tertiary)]/30') : 'bg-transparent'
                }`}>
                  {day && (
                    <>
                      <span className={`text-xs font-bold ${releaseDays.has(day) ? 'text-indigo-400' : 'text-gray-500'}`}>
                        {day}
                      </span>
                      {releaseDays.has(day) && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {dayItems[day]?.slice(0, 4).map((item, j) => (
                            <Link key={j} to={`/detail/${item.media_type}/${item.id}`} className="block group">
                              <div className="w-7 h-10 sm:w-9 sm:h-13 rounded overflow-hidden border border-[var(--border-primary)] hover:border-indigo-400 transition-all">
                                {item.poster ? (
                                  <img src={item.poster} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform" loading="lazy" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gray-800 text-[6px] text-gray-600">N/A</div>
                                )}
                              </div>
                            </Link>
                          ))}
                          {dayItems[day]?.length > 4 && (
                            <div className="w-7 h-10 sm:w-9 sm:h-13 rounded overflow-hidden bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                              <span className="text-[9px] font-bold text-indigo-300">+{dayItems[day].length - 4}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Release list */}
          {data?.days?.length > 0 ? (
            <div>
              <h2 className="text-lg font-bold text-gray-100 mb-4">Upcoming Releases</h2>
              <div className="space-y-3">
                {data.days.map(day => (
                  <div key={day.date} className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)] overflow-hidden">
                    <div className="px-4 py-2.5 bg-indigo-500/10 border-b border-[var(--border-primary)]">
                      <span className="text-sm font-semibold text-indigo-300">
                        {new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                      </span>
                      <span className="text-xs text-gray-500 ml-2">{day.items.length} release{day.items.length > 1 ? 's' : ''}</span>
                    </div>
                    <div className="p-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {day.items.map((item, i) => (
                        <Link key={i} to={`/detail/${item.media_type}/${item.id}`} className="group block">
                          <div className="bg-[var(--bg-tertiary)] rounded-xl overflow-hidden border border-[var(--border-primary)] hover:border-indigo-500/30 transition-all">
                            <div className="aspect-[2/3] bg-gray-800 relative overflow-hidden">
                              {item.poster ? (
                                <img src={item.poster} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">No poster</div>
                              )}
                              <div className="absolute top-1.5 right-1.5">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${item.media_type === 'movie' ? 'bg-indigo-500/80 text-white' : 'bg-emerald-500/80 text-white'}`}>
                                  {item.media_type === 'movie' ? 'Movie' : 'TV'}
                                </span>
                              </div>
                            </div>
                            <div className="p-2">
                              <p className="text-xs font-medium text-gray-200 truncate group-hover:text-indigo-300 transition-colors">{item.title}</p>
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className="text-[10px] text-yellow-400">★ {item.vote_average}</span>
                                {item.genre && item.genre !== 'Unknown' && (
                                  <span className="text-[10px] text-gray-500 truncate">{item.genre.split('|')[0]}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">📅</div>
              <p className="text-gray-500 text-sm">No upcoming releases for {MONTHS[month - 1]} {year}</p>
              <button onClick={nextMonth} className="mt-3 text-sm text-indigo-400 hover:text-indigo-300 transition-colors bg-transparent border-0 cursor-pointer">
                Check next month →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
