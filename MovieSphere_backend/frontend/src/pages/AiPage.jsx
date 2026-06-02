import { useState, useRef } from 'react'
import { askAi, askAiWithImage } from '../api/endpoints'

export default function AiPage() {
  const [mode, setMode] = useState('text')
  const [id, setId] = useState('')
  const [season, setSeason] = useState('')
  const [episode, setEpisode] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState(null)
  const fileRef = useRef()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setResult('')
    try {
      if (mode === 'image' && file) { const r = await askAiWithImage(file); setResult(r) }
      else if (id) { const r = await askAi(id, season || null, episode || null); setResult(r) }
    } catch {} finally { setLoading(false) }
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-extrabold text-gray-100">AI Explorer</h2>
        <p className="text-sm text-gray-500 mt-0.5">Get AI-powered insights about movies, shows, or images</p>
      </div>
      <div className="flex gap-2 mb-6 bg-[#12142a] rounded-lg p-1 w-fit">
        {['text', 'image'].map(m => (
          <button key={m} onClick={() => setMode(m)} className={`px-4 py-2 text-sm font-semibold rounded-md transition-all cursor-pointer ${mode === m ? 'bg-indigo-500 text-white' : 'text-gray-400 bg-transparent border-0'}`}>
            {m === 'text' ? 'Movie/TV ID' : 'Upload Image'}
          </button>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="max-w-lg space-y-4 mb-8">
        {mode === 'text' ? (
          <>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">Movie/TV ID</label>
              <input type="number" value={id} onChange={e => setId(e.target.value)} placeholder="e.g. 19995" required className="w-full px-3.5 py-2.5 bg-[#12142a] border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-500 outline-none focus:border-indigo-500" />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">Season (optional)</label>
                <input type="number" value={season} onChange={e => setSeason(e.target.value)} placeholder="1" className="w-full px-3.5 py-2.5 bg-[#12142a] border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-500 outline-none focus:border-indigo-500" />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">Episode (optional)</label>
                <input type="number" value={episode} onChange={e => setEpisode(e.target.value)} placeholder="1" className="w-full px-3.5 py-2.5 bg-[#12142a] border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-500 outline-none focus:border-indigo-500" />
              </div>
            </div>
          </>
        ) : (
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 font-medium">Upload an image</label>
            <input type="file" ref={fileRef} onChange={e => setFile(e.target.files[0])} accept="image/*" className="w-full text-sm text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-500 file:text-white hover:file:bg-indigo-600 cursor-pointer file:cursor-pointer" />
            {file && <p className="text-xs text-gray-500 mt-1.5">{file.name}</p>}
          </div>
        )}
        <button type="submit" disabled={loading} className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 text-white text-sm font-bold rounded-lg transition-all cursor-pointer">
          {loading ? 'Analyzing...' : 'Ask AI'}
        </button>
      </form>
      {result && (
        <div className="bg-[#1a1b32] rounded-xl p-6 border border-gray-800 max-w-2xl">
          <h3 className="text-sm font-bold text-gray-200 mb-3">AI Response</h3>
          <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{result}</p>
        </div>
      )}
    </div>
  )
}
