import { useState, useEffect, useRef } from 'react'
import client from '../api/client'
import { useCredits } from '../hooks/useCredits'

const TOTAL = 5
const TIME_LIMIT = 10

export default function TriviaPage() {
  const [phase, setPhase] = useState('loading') // loading | start | playing | results
  const [questions, setQuestions] = useState([])
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState(null)
  const [results, setResults] = useState([])
  const [creditsEarned, setCreditsEarned] = useState(0)
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT)
  const timerRef = useRef(null)
  const startTimeRef = useRef(null)
  const timesRef = useRef([])
  const { refreshCredits } = useCredits()
  const [submitLoading, setSubmitLoading] = useState(false)
  const [completedInfo, setCompletedInfo] = useState(null)

  useEffect(() => {
    client.get('/MovieSphere/trivia/today')
      .then(({ data: d }) => {
        if (d.completed) {
          setCompletedInfo(d)
          setPhase('results')
        } else if (d.questions && d.questions.length > 0) {
          setQuestions(d.questions)
          setPhase('start')
        } else {
          setPhase('start')
        }
      })
      .catch(() => setPhase('start'))
  }, [])

  const startQuiz = () => {
    setPhase('playing')
    setCurrent(0)
    setSelected(null)
    setResults([])
    setCreditsEarned(0)
    timesRef.current = []
    startTimeRef.current = Date.now()
    setTimeLeft(TIME_LIMIT)
  }

  useEffect(() => {
    if (phase !== 'playing' || selected !== null) return
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          handleSelect(-1)
          return 0
        }
        return prev - 1
      })
    }, 200)
    return () => clearInterval(timerRef.current)
  }, [phase, current, selected])

  const handleSelect = (index) => {
    if (selected !== null) return
    clearInterval(timerRef.current)
    const elapsed = Math.min((Date.now() - startTimeRef.current) / 1000, TIME_LIMIT)
    timesRef.current.push({ selected_index: index, time_taken: elapsed })
    setSelected(index)
  }

  const nextQuestion = () => {
    if (current + 1 < TOTAL) {
      setCurrent(c => c + 1)
      setSelected(null)
      setTimeLeft(TIME_LIMIT)
      startTimeRef.current = Date.now()
    } else {
      submitQuiz()
    }
  }

  useEffect(() => {
    if (selected !== null) {
      const delay = current + 1 < TOTAL ? 600 : 800
      const t = setTimeout(nextQuestion, delay)
      return () => clearTimeout(t)
    }
  }, [selected])

  const submitQuiz = async () => {
    setSubmitLoading(true)
    try {
      const { data: d } = await client.post('/MovieSphere/trivia/submit', {
        answers: timesRef.current,
      })
      if (d.already_completed) {
        setCompletedInfo(d)
      } else {
        setResults(d.results || [])
        setCreditsEarned(d.credits_earned || 0)
        if (refreshCredits) refreshCredits()
      }
    } catch {
      // fallback: compute locally
      setResults(timesRef.current.map(() => ({ correct: false, credits_earned: 0 })))
    } finally {
      setSubmitLoading(false)
      setPhase('results')
    }
  }

  if (phase === 'loading') {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-10 h-10 border-[3px] border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (phase === 'start' && !questions.length) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
          <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">No Quiz Available</h2>
        <p className="text-gray-400 text-sm">The daily quiz hasn't been generated yet. Check back later!</p>
      </div>
    )
  }

  if (phase === 'start') {
    return (
      <div className="max-w-lg mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-xl shadow-indigo-500/25">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">Daily Trivia</h1>
          <p className="text-gray-400 text-sm">Answer {TOTAL} questions correctly within {TIME_LIMIT} seconds each to earn credits!</p>
        </div>
        <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-primary)] p-6 mb-6">
          <div className="flex items-center justify-around text-center">
            <div>
              <div className="text-2xl font-bold text-indigo-400">{TOTAL}</div>
              <div className="text-xs text-gray-500 mt-1">Questions</div>
            </div>
            <div className="w-px h-10 bg-[var(--border-primary)]" />
            <div>
              <div className="text-2xl font-bold text-amber-400">{TIME_LIMIT}s</div>
              <div className="text-xs text-gray-500 mt-1">Per Question</div>
            </div>
            <div className="w-px h-10 bg-[var(--border-primary)]" />
            <div>
              <div className="text-2xl font-bold text-emerald-400">+2</div>
              <div className="text-xs text-gray-500 mt-1">Credits Each</div>
            </div>
          </div>
        </div>
        <button onClick={startQuiz} className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold hover:from-indigo-400 hover:to-purple-400 transition-all cursor-pointer border-0 shadow-xl shadow-indigo-500/20">
          Start Quiz
        </button>
      </div>
    )
  }

  if (phase === 'results') {
    const correctCount = results.filter(r => r.correct).length
    const isCompleted = completedInfo || (results.length > 0)

    return (
      <div className="max-w-lg mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className={`w-20 h-20 mx-auto mb-5 rounded-full flex items-center justify-center shadow-xl ${
            (completedInfo ? completedInfo.total_correct : correctCount) >= 3
              ? 'bg-gradient-to-br from-emerald-500 to-green-500 shadow-emerald-500/25'
              : 'bg-gradient-to-br from-amber-500 to-orange-500 shadow-amber-500/25'
          }`}>
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              {completedInfo || results.length > 0 ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              )}
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
            {completedInfo ? "Today's Quiz Done!" : "Quiz Complete!"}
          </h1>
          <p className="text-gray-400 text-sm">Come back tomorrow for a new challenge</p>
        </div>

        <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-primary)] p-6 text-center mb-6">
          <div className="text-5xl font-extrabold text-white mb-2">
            {completedInfo ? `${completedInfo.total_correct}/${completedInfo.total_questions}` : `${correctCount}/${TOTAL}`}
          </div>
          <div className="text-gray-400 text-sm mb-4">Correct Answers</div>
          {completedInfo ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 text-amber-400 font-bold text-sm">
              <span>⚡</span> +{completedInfo.credits_earned} credits earned
            </div>
          ) : creditsEarned > 0 ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 text-amber-400 font-bold text-sm">
              <span>⚡</span> +{creditsEarned} credits earned
            </div>
          ) : (
            <div className="text-gray-500 text-sm">Better luck tomorrow!</div>
          )}
        </div>

        {!completedInfo && results.length > 0 && (
          <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-primary)] p-4">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Question Breakdown</h3>
            <div className="space-y-2">
              {questions.map((q, i) => (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-xl text-sm ${
                  results[i]?.correct ? 'bg-emerald-500/5 border border-emerald-500/10' : 'bg-red-500/5 border border-red-500/10'
                }`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                    results[i]?.correct ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white truncate">{q.question}</div>
                    <div className="text-xs text-gray-500 mt-0.5 capitalize">{q.media_title}</div>
                  </div>
                  <div className={`text-xs font-bold ${results[i]?.correct ? 'text-emerald-400' : 'text-red-400'}`}>
                    {results[i]?.correct ? '+2' : '0'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-gray-600 text-xs mt-6">Next quiz resets at midnight</p>
      </div>
    )
  }

  // Playing phase
  const q = questions[current]
  const progress = ((current) / TOTAL) * 100
  const timerPct = (timeLeft / TIME_LIMIT) * 100

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* Progress bar */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-1.5 rounded-full bg-gray-800 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
        <span className="text-sm font-bold text-indigo-400">{current + 1}/{TOTAL}</span>
      </div>

      {/* Timer */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-gray-500">Time remaining</span>
          <span className={`text-sm font-bold ${timeLeft <= 3 ? 'text-red-400' : 'text-gray-300'}`}>{timeLeft}s</span>
        </div>
        <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-200 ${
            timeLeft <= 3 ? 'bg-red-500' : timeLeft <= 6 ? 'bg-amber-500' : 'bg-indigo-500'
          }`} style={{ width: `${timerPct}%` }} />
        </div>
      </div>

      {/* Question card */}
      <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-primary)] p-5 sm:p-6 mb-4">
        <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-3">
          {q?.type === 'year' ? 'Release Year' : q?.type === 'genre' ? 'Genre' : q?.type === 'director' ? 'Director' : 'Question'}
        </div>
        <h2 className="text-lg sm:text-xl font-bold text-white leading-snug mb-1">{q?.question}</h2>
        {q?.media_title && (
          <p className="text-xs text-gray-500">Related to: {q.media_title}</p>
        )}
      </div>

      {/* Options */}
      <div className="space-y-2.5">
        {q?.options.map((opt, i) => {
          let style = 'bg-[var(--bg-secondary)] border-[var(--border-primary)] text-gray-200 hover:border-indigo-500/40'
          if (selected !== null) {
            if (i === selected) {
              style = 'bg-red-500/10 border-red-500/40 text-red-300'
            }
          }
          return (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              disabled={selected !== null}
              className={`w-full text-left p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                selected !== null ? 'opacity-70' : 'hover:bg-indigo-500/5'
              } ${style}`}
            >
              <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                selected !== null && i === selected
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-[var(--bg-tertiary)] text-gray-500'
              }`}>
                {String.fromCharCode(65 + i)}
              </span>
              <span className="text-sm sm:text-base font-medium">{opt}</span>
            </button>
          )
        })}
      </div>

      {selected !== null && current + 1 < TOTAL && (
        <p className="text-center text-gray-500 text-xs mt-4 animate-pulse">Next question...</p>
      )}
    </div>
  )
}
