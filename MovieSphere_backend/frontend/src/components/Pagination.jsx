const MAX_PAGES = 100

export default function Pagination({ currentPage, onPageChange }) {
  if (MAX_PAGES <= 1) return null

  const maxVisible = 5
  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2))
  let end = Math.min(MAX_PAGES, start + maxVisible - 1)
  if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1)

  const pages = []
  for (let i = start; i <= end; i++) pages.push(i)

  return (
    <div className="flex justify-center flex-wrap gap-2 mt-6 mb-8">
      {currentPage > 1 && (
        <button onClick={() => onPageChange(currentPage - 1)} className="px-3.5 py-2 border border-gray-700 rounded-lg bg-[#12142a] text-gray-400 text-sm cursor-pointer hover:bg-[#1e2040] hover:text-gray-200 transition-all">
          Prev
        </button>
      )}
      {pages.map(p => (
        <button key={p} onClick={() => onPageChange(p)} className={`px-3.5 py-2 border rounded-lg text-sm cursor-pointer transition-all ${p === currentPage ? 'bg-indigo-500 text-white border-indigo-500' : 'border-gray-700 bg-[#12142a] text-gray-400 hover:bg-[#1e2040] hover:text-gray-200'}`}>
          {p}
        </button>
      ))}
      {currentPage < MAX_PAGES && (
        <button onClick={() => onPageChange(currentPage + 1)} className="px-3.5 py-2 border border-gray-700 rounded-lg bg-[#12142a] text-gray-400 text-sm cursor-pointer hover:bg-[#1e2040] hover:text-gray-200 transition-all">
          Next
        </button>
      )}
    </div>
  )
}
