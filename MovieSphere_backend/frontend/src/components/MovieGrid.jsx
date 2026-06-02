import MovieCard from './MovieCard'

export default function MovieGrid({ items, onFavChange, mediaType }) {
  if (!items || items.length === 0) return <div className="text-center py-16 text-gray-500">No items found</div>
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
      {items.map((item, i) => <MovieCard key={item.Id || item.id || i} item={item} onFavChange={onFavChange} mediaType={mediaType} />)}
    </div>
  )
}
