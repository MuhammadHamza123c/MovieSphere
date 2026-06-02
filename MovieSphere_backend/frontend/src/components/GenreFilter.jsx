export default function GenreFilter({ genres, selected, onSelect }) {
  if (!genres || genres.length === 0) return null
  return (
    <div className="mb-5">
      <select value={selected} onChange={e => onSelect(e.target.value)} className="px-3 py-2 bg-[#12142a] border border-gray-700 rounded-lg text-sm text-gray-200 outline-none focus:border-indigo-500 cursor-pointer w-full max-w-xs">
        <option value="">All Genres</option>
        {genres.map(g => (
          <option key={g.id} value={String(g.id)}>{g.name}</option>
        ))}
      </select>
    </div>
  )
}
