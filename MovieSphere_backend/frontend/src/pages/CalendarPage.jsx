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
      .then(({ data: d }) => { setData(d.MovieSphere); setLoading(false) })
      .catch(() => setLoading(false))
  }, [month, year])

  const goPrev = () => { if (month === 1) { setMonth(12); setYear(y => y - 1) } else setMonth(m => m - 1) }
  const goNext = () => { if (month === 12) { setMonth(1); setYear(y => y + 1) } else setMonth(m => m + 1) }
  const goToday = () => { const n = new Date(); setMonth(n.getMonth() + 1); setYear(n.getFullYear()) }

  const todayDate = now.getDate()
  const todayMonth = now.getMonth() + 1
  const todayYear = now.getFullYear()

  const firstDay = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()

  const releaseDays = new Set((data?.days || []).map(d => parseInt(d.date.slice(8))))
  const dayItems = {}
  ;(data?.days || []).forEach(d => { dayItems[parseInt(d.date.slice(8))] = d.items })

  const totalReleases = data?.total || 0

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
      {/* Header */}
      <div className="relative mb-6 sm:mb-8 rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/30 via-purple-600/20 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.15),transparent_70%)]" />
        <div className="relative px-5 sm:px-8 py-6 sm:py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Content Calendar</h1>
              <p className="text-sm text-indigo-300/80 mt-1">
                {totalReleases > 0 ? `${totalReleases} release${totalReleases > 1 ? 's' : ''} this month` : 'No releases this month'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={goToday} className="hidden sm:flex px-4 py-2 text-xs font-semibold rounded-xl bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-all cursor-pointer border-0 backdrop-blur-sm">
                Today
              </button>
              <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 backdrop-blur-sm">
                <button onClick={goPrev} className="w-9 h-9 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer border-0">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <span className="text-sm sm:text-base font-bold text-white w-36 sm:w-44 text-center select-none">{MONTHS[month - 1]} {year}</span>
                <button onClick={goNext} className="w-9 h-9 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer border-0">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-10 h-10 border-[3px] border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-primary)] overflow-hidden shadow-xl shadow-black/10">
          <div className="grid grid-cols-7">
            {WEEKDAYS.map(d => (
              <div key={d} className="py-2.5 sm:py-3 text-center text-[11px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-[var(--border-primary)] bg-[var(--bg-tertiary)]/20">
                {d}
              </div>
            ))}

            {cells.map((day, i) => {
              const isToday = day === todayDate && month === todayMonth && year === todayYear
              const hasRelease = day && releaseDays.has(day)
              const items = day ? (dayItems[day] || []) : []

              return (
                <div key={i} className={`relative border-b border-r border-[var(--border-primary)] transition-all duration-200 ${
                  !day ? 'bg-transparent' :
                  hasRelease ? 'bg-gradient-to-b from-indigo-500/[0.03] to-transparent' :
                  'hover:bg-[var(--bg-tertiary)]/20'
                }`}
                  style={{ minHeight: 'clamp(100px, 14vw, 170px)' }}
                >
                  {day && (
                    <div className="p-1.5 sm:p-2 h-full flex flex-col">
                      <div className="flex items-center justify-between mb-1 sm:mb-1.5">
                        <div className={`flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full text-xs font-bold transition-all ${
                          isToday ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 ring-2 ring-indigo-400/30' :
                          hasRelease ? 'text-indigo-400' :
                          'text-gray-500'
                        }`}>
                          {day}
                        </div>

                      </div>

                      {hasRelease && (
                        <div className="flex-1 grid grid-cols-2 gap-1">
                          {items.slice(0, 6).map((item, j) => (
                            <Link key={j} to={`/detail/${item.media_type}/${item.id}`} className="group block">
                              <div className="aspect-[2/3] rounded-lg overflow-hidden border border-[var(--border-primary)]/60 bg-gray-800 relative shadow-sm hover:shadow-md hover:shadow-indigo-500/10 hover:border-indigo-400/40 transition-all duration-200">
                                {item.poster ? (
                                  <img src={item.poster} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" loading="lazy" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-600 text-[8px]">No poster</div>
                                )}
                                <div className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                  <span className={`px-1 py-[1px] rounded text-[7px] font-bold uppercase tracking-wide ${
                                    item.media_type === 'movie' ? 'bg-indigo-500/90 text-white' : 'bg-emerald-500/90 text-white'
                                  }`}>
                                    {item.media_type === 'movie' ? 'M' : 'TV'}
                                  </span>
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                              </div>
                            </Link>
                          ))}
                          {items.length > 6 && (
                            <Link to="/upcoming" className="aspect-[2/3] rounded-lg overflow-hidden bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center hover:bg-indigo-500/20 transition-all group">
                              <span className="text-sm sm:text-base font-bold text-indigo-400 group-hover:text-indigo-300 transition-colors">+{items.length - 6}</span>
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <button onClick={goToday} className="sm:hidden fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-indigo-500 text-white shadow-xl shadow-indigo-500/30 flex items-center justify-center hover:bg-indigo-400 transition-all cursor-pointer border-0">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </button>
    </div>
  )
}
