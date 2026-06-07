export default function GenreFilter({ genres = [], selected, onSelect }) {
  if (!genres || genres.length === 0) return null
  return (
    <div className="flex flex-wrap gap-2">
      <button onClick={() => onSelect('')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer border ${
                !selected
                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                  : 'bg-[#12142a] text-gray-400 border-[#1e2040] hover:border-gray-600 hover:text-gray-200'
              }`}>
        All
      </button>
      {genres.map(g => (
        <button key={g.id} onClick={() => onSelect(String(g.id) === selected ? '' : String(g.id))}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer border ${
                  String(g.id) === selected
                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                    : 'bg-[#12142a] text-gray-400 border-[#1e2040] hover:border-gray-600 hover:text-gray-200'
                }`}>
          {g.name}
        </button>
      ))}
    </div>
  )
}
