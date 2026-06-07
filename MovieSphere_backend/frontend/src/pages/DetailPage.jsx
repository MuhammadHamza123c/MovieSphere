import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchDetail, fetchCast, fetchRecommendations, fetchComments, postComment, deleteComment, checkWatchLater, addWatchLater, removeWatchLater, addFavorite, removeFavorite, fetchFavorites, fetchMedia, fetchSeasonEpisodes } from '../api/endpoints'
import { useAuth } from '../hooks/useAuth'
import CastCard from '../components/CastCard'
import GenreTag from '../components/GenreTag'
import MovieCard from '../components/MovieCard'

export default function DetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const mediaType = window.location.pathname.startsWith('/tv') ? 'tv' : 'movie'
  const [data, setData] = useState(null)
  const [cast, setCast] = useState([])
  const [recs, setRecs] = useState([])
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [newRating, setNewRating] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [currentUserId, setCurrentUserId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedSeason, setSelectedSeason] = useState(1)
  const [selectedEpisode, setSelectedEpisode] = useState(1)
  const [seasonEpisodes, setSeasonEpisodes] = useState([])
  const [inWatchLater, setInWatchLater] = useState(false)
  const [isFav, setIsFav] = useState(false)
  const [mediaItems, setMediaItems] = useState(null)
  const [lightbox, setLightbox] = useState(null)
  const [videoPlayer, setVideoPlayer] = useState(null)

  useEffect(() => {
    setInWatchLater(false)
    setIsFav(false)
    setLoading(true)
    setCurrentUserId(user?.id)
    if (user?.id) {
      checkWatchLater(id, mediaType).then(res => {
        if (res?.in_watch_later) setInWatchLater(true)
      }).catch(() => {})
    }
    Promise.all([fetchDetail('', id, mediaType), fetchCast('', id, mediaType), fetchComments(id, mediaType), fetchMedia(id, mediaType)])
      .then(([detail, castData, commentData, mediaData]) => {
        setData(detail)
        setCast(castData)
        setComments(commentData)
        if (mediaData?.images?.length || mediaData?.trailers?.length || mediaData?.other_videos?.length) setMediaItems(mediaData)
        const title = detail.Title || detail.title || ''
        if (title) {
          fetchRecommendations(title).then(setRecs).catch(() => {})
          fetchFavorites().then(favs => {
            const match = favs.find(f => (f.Title || f.title || '').toLowerCase() === title.toLowerCase())
            if (match) setIsFav(true)
          }).catch(() => {})
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id, user])

  useEffect(() => {
    if (mediaType !== 'tv') return

    fetchSeasonEpisodes(id, selectedSeason)
      .then(setSeasonEpisodes)
      .catch(() => setSeasonEpisodes([]))
  }, [id, mediaType, selectedSeason])

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-[400px] bg-[#1a1b32] rounded-2xl" />
        <div className="space-y-3"><div className="h-4 bg-[#1a1b32] rounded w-1/4" /><div className="h-3 bg-[#1a1b32] rounded w-3/4" /><div className="h-3 bg-[#1a1b32] rounded w-1/2" /></div>
      </div>
    )
  }

  if (!data) return <div className="text-center py-20 text-gray-500">Failed to load details</div>

  const title = data.Title || data.title || 'Untitled'
  const poster = data.Poster_path || data.poster_path || ''
  const posterUrl = poster ? (poster.startsWith('http') ? poster : `https://image.tmdb.org/t/p/w780${poster}`) : ''
  const backdrop = data.Backdrop_path || data.backdrop_path || ''
  const backdropUrl = backdrop.startsWith('http') ? backdrop : (backdrop ? `https://image.tmdb.org/t/p/w1280${backdrop}` : '')
  const overview = data.Overview || data.overview || 'No overview available.'
  const rating = data.vote_average || data.Popularity || 0
  const displayRating = rating ? (typeof rating === 'number' ? rating.toFixed(1) : rating) : 'N/A'
  const date = data.Release_date || data.release_date || ''
  const year = date.split('-')[0]
  const genres = data.Genre || data.genres || ''
  const genreArr = typeof genres === 'string' ? genres.split('|').filter(Boolean) : (Array.isArray(genres) ? genres.map(g => g.name || g) : [])
  const seasons = data['Seasons/Episode'] || data.Seasons || data.seasons || []
  const availableSeasons = seasons
    .map(s => ({
      number: s.season_number || s.Season_number,
      name: s.name || s.Name,
      episodeCount: s.episode_count || s.Episode_count,
      posterPath: s.poster_path || s.Poster_path,
    }))
    .filter(s => s.number != null && !s.name?.toLowerCase().includes('specials'))
  const activeSeason = seasons.find(s => (s.season_number || s.Season_number) === selectedSeason)
  const episodeCount = activeSeason?.episode_count || activeSeason?.Episode_count || 1
  const visibleEpisodes = seasonEpisodes.length
    ? seasonEpisodes
    : Array.from({ length: episodeCount }, (_, i) => ({ episode_number: i + 1, name: `Episode ${i + 1}` }))

  const runtime = data.runtime
  const runtimeDisplay = runtime ? `${Math.floor(runtime / 60)}h ${runtime % 60}m` : null
  const langMap = { en: 'English', es: 'Spanish', fr: 'French', de: 'German', ja: 'Japanese', ko: 'Korean', zh: 'Chinese', hi: 'Hindi', pt: 'Portuguese', ru: 'Russian', it: 'Italian', ar: 'Arabic', tr: 'Turkish', nl: 'Dutch', sv: 'Swedish', no: 'Norwegian', da: 'Danish', fi: 'Finnish', pl: 'Polish', cs: 'Czech', hu: 'Hungarian', ro: 'Romanian', th: 'Thai', vi: 'Vietnamese', uk: 'Ukrainian', el: 'Greek', he: 'Hebrew' }
  const language = data.Language ? (langMap[data.Language] || data.Language.toUpperCase()) : null
  const budget = data.Budget
  const budgetDisplay = budget > 0 ? '$' + (budget >= 1000000 ? (budget / 1000000).toFixed(1) + 'M' : (budget / 1000).toFixed(0) + 'K') : null
  const revenue = data.Revenue
  const revenueDisplay = revenue > 0 ? '$' + (revenue >= 1000000 ? (revenue / 1000000).toFixed(1) + 'M' : (revenue / 1000).toFixed(0) + 'K') : null
  const production = data.Production
  const voteCount = data.vote_count

  const extraDetails = [
    runtimeDisplay && { label: 'Runtime', value: runtimeDisplay },
    language && { label: 'Language', value: language },
    budgetDisplay && { label: 'Budget', value: budgetDisplay },
    revenueDisplay && { label: 'Revenue', value: revenueDisplay },
    voteCount && { label: 'Votes', value: voteCount.toLocaleString() },
    production && { label: 'Production', value: production },
  ].filter(Boolean)

  const toggleWatchLater = async () => {
    try {
      if (inWatchLater) {
        await removeWatchLater(id, mediaType)
        setInWatchLater(false)
      } else {
        await addWatchLater(id, mediaType)
        setInWatchLater(true)
      }
    } catch {}
  }

  const toggleFavorite = async () => {
    try {
      if (isFav) {
        await removeFavorite(title)
        setIsFav(false)
      } else {
        await addFavorite(title)
        setIsFav(true)
      }
    } catch {}
  }

  return (
    <div>
      <button onClick={() => navigate(-1)} className="mb-4 px-3.5 py-2 border border-gray-700/50 rounded-lg text-sm text-gray-500 hover:text-gray-200 hover:border-gray-600 hover:bg-[#1e2040]/50 transition-all cursor-pointer bg-transparent">&larr; Back</button>
      <div className="relative rounded-2xl overflow-hidden mb-8 min-h-[250px] md:min-h-[420px] shadow-2xl shadow-black/30" style={backdropUrl ? { backgroundImage: `url(${backdropUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}>
        <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-[#0b0d17] via-[#0b0d17]/80 to-[#0b0d17]/30" />
        <div className="relative flex gap-4 sm:gap-6 md:gap-8 p-4 sm:p-6 md:p-10 items-center min-h-[250px] md:min-h-[420px] flex-col md:flex-row">
          {posterUrl && (
            <div className="flex-shrink-0">
              <img src={posterUrl} alt={title} className="w-full max-w-[220px] sm:max-w-[260px] md:w-80 rounded-xl shadow-2xl shadow-black/60 border border-gray-700/30" />
            </div>
          )}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-100">{title}</h1>
              {year && <span className="text-lg text-gray-400">({year})</span>}
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-400 mb-3">
              <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-md text-xs font-semibold uppercase tracking-wide">{mediaType === 'tv' ? 'TV Series' : 'Movie'}</span>
              <span className="text-gray-500">|</span>
              <span>{displayRating}/10</span>
              {date && <><span className="text-gray-500">|</span><span>{date}</span></>}
            </div>
            <div className="flex flex-wrap gap-1.5 mb-4">{genreArr.map((g, i) => <GenreTag key={i} name={g} />)}</div>
            <p className="text-sm text-gray-400 leading-relaxed max-w-2xl mb-5 line-clamp-4">{overview}</p>
            <div className="flex flex-wrap items-center gap-3">
              <button onClick={() => {
                if (mediaType === 'tv' && seasons.length) {
                  navigate(`/watch/tv/${id}/${selectedSeason}/${selectedEpisode}`)
                } else {
                  navigate(`/watch/${mediaType}/${id}`)
                }
              }} className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold rounded-lg transition-all cursor-pointer shadow-lg shadow-indigo-500/25">Play Now</button>

              <button onClick={toggleFavorite} className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-700/50 rounded-lg text-sm font-medium transition-all cursor-pointer bg-transparent hover:border-gray-600" style={{ color: isFav ? '#ef4444' : '#9ca3af' }}>
                <svg className="w-5 h-5" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                Favorite
              </button>
              <button onClick={toggleWatchLater} className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-700/50 rounded-lg text-sm font-medium transition-all cursor-pointer bg-transparent hover:border-gray-600" style={{ color: inWatchLater ? '#f59e0b' : '#9ca3af' }}>
                <svg className="w-5 h-5" fill={inWatchLater ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Watch Later
              </button>
            </div>
          </div>
        </div>
      </div>

      {extraDetails.length > 0 && (
        <div className="mb-10 bg-[#12142a]/40 rounded-2xl p-5 border border-gray-800/40">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {extraDetails.map((d, i) => (
              <div key={i}>
                <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">{d.label}</p>
                <p className="text-sm font-semibold text-gray-200">{d.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="sticky top-0 z-30 bg-[#0b0d17]/90 backdrop-blur-md border-b border-gray-800/30 -mx-4 md:-mx-6 px-4 md:px-6 py-3 mb-8 overflow-x-auto scrollbar-thin flex items-center gap-2">
        {[
          mediaType === 'tv' && seasons.length > 0 && { id: 'seasons', label: 'Episodes' },
          data.Crew && { id: 'crew', label: 'Crew' },
          cast.length > 0 && { id: 'cast', label: 'Cast' },
          mediaItems && (mediaItems.trailers?.length > 0 || mediaItems.other_videos?.length > 0 || mediaItems.images?.length > 0) && { id: 'media', label: 'Media' },
          recs.length > 0 && { id: 'recommendations', label: 'Recommendations' },
          { id: 'reviews', label: 'Reviews' },
        ].filter(Boolean).map(s => (
          <a key={s.id} href={`#${s.id}`} onClick={e => { e.preventDefault(); document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }}
             className="flex-shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border border-gray-700/50 text-gray-400 hover:text-gray-200 hover:border-gray-600 hover:bg-[#1e2040]/50">
            {s.label}
          </a>
        ))}
      </div>

      {mediaType === 'tv' && availableSeasons.length > 0 && (
        <div id="seasons" className="mb-10 scroll-mt-20">
          <div className="flex items-center gap-3 mb-5">
            <h3 className="text-lg font-bold text-gray-100">Episodes</h3>
            <div className="h-px flex-1 bg-gradient-to-r from-indigo-500/20 to-transparent" />
          </div>
          <div className="bg-[#12142a]/60 border border-gray-800/40 rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-gray-800/60">
              <div className="flex gap-4 overflow-x-auto pb-1">
                {availableSeasons.map(s => {
                  const active = Number(s.number) === selectedSeason
                  return (
                    <button
                      key={s.number}
                      onClick={() => { setSelectedSeason(Number(s.number)); setSelectedEpisode(1) }}
                      className={`group relative flex-shrink-0 w-28 overflow-hidden rounded-xl border transition-all cursor-pointer ${
                        active
                          ? 'border-indigo-400 shadow-lg shadow-indigo-500/20'
                          : 'border-gray-800 hover:border-indigo-500/50'
                      }`}
                    >
                      <div className="aspect-[2/3] bg-[#181a36]">
                        {(s.posterPath || posterUrl) ? (
                          <img src={s.posterPath || posterUrl} alt={`Season ${s.number}`} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                        ) : (
                          <div className="h-full w-full bg-gradient-to-br from-[#181a36] to-[#0b0d17]" />
                        )}
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-2 text-left">
                        <p className="text-xs font-extrabold text-white">Season {s.number}</p>
                        {s.episodeCount && <p className="text-[10px] text-gray-300">{s.episodeCount} episodes</p>}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="p-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {visibleEpisodes.map(ep => {
                const episodeNumber = ep.episode_number
                const active = episodeNumber === selectedEpisode
                const episodeImage = ep.still_path || posterUrl || backdropUrl
                return (
                  <div
                    key={episodeNumber}
                    className={`group overflow-hidden rounded-xl border transition-all ${
                      active
                        ? 'bg-indigo-500/15 border-indigo-400/70 shadow-lg shadow-indigo-500/10'
                        : 'bg-[#181a36]/70 border-gray-800/70 hover:border-indigo-500/40 hover:bg-[#1d2042]'
                    }`}
                  >
                    <div className="relative aspect-video bg-black overflow-hidden">
                      {episodeImage ? (
                        <img src={episodeImage} alt={ep.name || `Episode ${episodeNumber}`} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-[#1d2042] to-black" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                      <span className="absolute left-3 top-3 rounded-lg bg-black/70 px-2.5 py-1 text-xs font-extrabold text-white backdrop-blur-sm">
                        Episode {episodeNumber}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedEpisode(episodeNumber)
                          navigate(`/watch/tv/${id}/${selectedSeason}/${episodeNumber}`)
                        }}
                        className="absolute inset-x-4 bottom-4 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-lg shadow-indigo-500/25"
                      >
                        Play Episode
                      </button>
                    </div>
                    <div className="p-4">
                      <div className="min-w-0 pr-1">
                        <p className="text-sm font-bold text-gray-100 line-clamp-1">{ep.name || `Episode ${episodeNumber}`}</p>
                        {ep.runtime && <p className="text-xs text-gray-500 mt-1">{ep.runtime} min</p>}
                      </div>
                      {ep.overview && (
                        <p className="text-xs text-gray-500 leading-relaxed line-clamp-3 mt-3">{ep.overview}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {data.Crew && (
        <div id="crew" className="mb-8 scroll-mt-20">
          <h3 className="text-lg font-bold text-gray-200 mb-4">Crew</h3>
          <div className="flex flex-wrap gap-2">
            {data.Crew.split('|').map((entry, i) => {
              const [role, ...nameParts] = entry.trim().split(': ')
              const name = nameParts.join(': ')
              return (
                <div key={i} className="bg-[#12142a]/60 border border-gray-800/50 rounded-lg px-4 py-2.5">
                  <p className="text-[10px] uppercase tracking-wider text-indigo-400 font-semibold">{role}</p>
                  <p className="text-sm text-gray-200 font-medium">{name}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {cast.length > 0 && (
        <div id="cast" className="mb-10 scroll-mt-20">
          <h3 className="text-lg font-bold text-gray-200 mb-4">Cast</h3>
          <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-thin">
            {cast.map((c, i) => <CastCard key={c.Id || c.id || i} cast={c} />)}
          </div>
        </div>
      )}

      {mediaItems && (mediaItems.trailers?.length > 0 || mediaItems.other_videos?.length > 0 || mediaItems.images?.length > 0) && (
        <div id="media" className="mb-10 scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <h3 className="text-lg font-bold text-gray-100">Media</h3>
            <div className="h-px flex-1 bg-gradient-to-r from-indigo-500/20 to-transparent" />
          </div>
          {mediaItems.trailers?.length > 0 && (
            <div className="mb-8">
              <h4 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                Trailers
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {mediaItems.trailers.map((v, i) => (
                  <button key={i} onClick={() => setVideoPlayer(v.key)} className="group relative overflow-hidden rounded-xl bg-black/40 border border-red-900/30 hover:border-red-500/40 transition-all cursor-pointer text-left w-full">
                    <div className="aspect-video relative">
                      <img src={`https://img.youtube.com/vi/${v.key}/maxresdefault.jpg`} alt={v.name} className="w-full h-full object-cover" loading="lazy" />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all flex items-center justify-center">
                        <div className="w-14 h-14 rounded-full bg-red-600/90 group-hover:bg-red-600 flex items-center justify-center shadow-lg shadow-red-600/30 transition-all group-hover:scale-110">
                          <svg className="w-6 h-6 text-white ml-0.5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                        </div>
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-medium text-gray-300 truncate">{v.name}</p>
                      <p className="text-xs text-red-400/80 mt-0.5 capitalize">{v.type}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          {mediaItems.other_videos?.length > 0 && (
            <div className="mb-8">
              <h4 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                More Videos
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {mediaItems.other_videos.slice(0, 4).map((v, i) => (
                  <button key={i} onClick={() => setVideoPlayer(v.key)} className="group relative overflow-hidden rounded-xl bg-black/40 border border-gray-800/50 hover:border-indigo-500/30 transition-all cursor-pointer text-left w-full">
                    <div className="aspect-video relative">
                      <img src={`https://img.youtube.com/vi/${v.key}/maxresdefault.jpg`} alt={v.name} className="w-full h-full object-cover" loading="lazy" />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all flex items-center justify-center">
                        <div className="w-14 h-14 rounded-full bg-indigo-500/90 group-hover:bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 transition-all group-hover:scale-110">
                          <svg className="w-6 h-6 text-white ml-0.5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                        </div>
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-medium text-gray-300 truncate">{v.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5 capitalize">{v.type}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          {mediaItems.images?.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                Photos
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {mediaItems.images.map((img, i) => (
                  <button key={i} onClick={() => setLightbox(i)} className="group relative overflow-hidden rounded-lg bg-[#12142a] border border-gray-800/40 hover:border-indigo-500/30 transition-all aspect-video cursor-pointer text-left w-full">
                    <img src={`https://image.tmdb.org/t/p/w400${img.file_path}`} alt="" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                      <svg className="w-5 h-5 text-white/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"/></svg>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {recs.length > 0 && (
        <div id="recommendations" className="scroll-mt-20">
          <h3 className="text-lg font-bold text-gray-200 mb-4">Recommendations</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
            {recs.slice(0, 10).map((r, i) => <MovieCard key={r.Id || r.id || i} item={r} />)}
          </div>
        </div>
      )}

      <div id="reviews" className="mt-10 mb-12 scroll-mt-20">
        <div className="flex items-center gap-3 mb-6">
          <h3 className="text-xl font-bold text-gray-100">Reviews</h3>
          <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-md text-xs font-semibold">{comments.length}</span>
          <div className="h-px flex-1 bg-gradient-to-r from-indigo-500/20 to-transparent" />
        </div>

        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl blur-sm opacity-0 group-focus-within:opacity-100 transition-opacity" />
          <div className="relative bg-[#12142a]/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/30 group-focus-within:border-indigo-500/40 transition-all mb-6">
            <textarea value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Share your thoughts about this title..." className="w-full bg-transparent border-0 border-b border-gray-700/50 focus:border-indigo-400/60 rounded-none p-2 text-sm text-gray-100 outline-none resize-none h-20 mb-4 placeholder-gray-600 transition-all" />
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-500 mr-1">Rate</span>
                {[1,2,3,4,5].map(n => (
                  <button key={n} onClick={() => setNewRating(newRating === n ? 0 : n)} className="group/star transition-all duration-150 hover:scale-110">
                    <svg className={`w-6 h-6 transition-all duration-150 ${n <= newRating ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)] scale-110' : 'text-gray-600 group-hover/star:text-gray-400'}`} fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                  </button>
                ))}
              </div>
              <button onClick={async () => {
                if (!newComment.trim() && !newRating) return
                setSubmitting(true)
                try {
                  const c = await postComment(id, mediaType, newRating || null, newComment.trim() || null)
                  if (c) setComments(prev => [c, ...prev])
                  setNewComment('')
                  setNewRating(0)
                } catch {}
                setSubmitting(false)
              }} disabled={submitting} className="px-5 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30">Submit</button>
            </div>
          </div>
        </div>

        {comments.length === 0 ? (
          <div className="text-center py-12 bg-[#12142a]/40 rounded-2xl border border-dashed border-gray-700/30">
            <svg className="w-12 h-12 mx-auto text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
            <p className="text-gray-500 text-sm">No reviews yet. Be the first to share your thoughts!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {comments.map(c => (
              <div key={c.id} className="bg-[#12142a]/70 backdrop-blur-sm rounded-xl p-5 border border-gray-800/50 hover:border-gray-700/50 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-indigo-500/20">{c.username?.charAt(0)?.toUpperCase() || '?'}</div>
                    <div>
                      <span className="text-sm font-semibold text-gray-200">{c.username}</span>
                      <div className="flex items-center gap-0.5 mt-0.5">
                        {c.rating && [1,2,3,4,5].map(n => (
                          <svg key={n} className={`w-3.5 h-3.5 ${n <= c.rating ? 'text-yellow-400' : 'text-gray-600'}`} fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600">{new Date(c.created_at).toLocaleDateString()}</span>
                    {currentUserId && c.user_id === currentUserId && (
                      <button onClick={async () => {
                        try {
                          await deleteComment(c.id)
                          setComments(prev => prev.filter(x => x.id !== c.id))
                        } catch {}
                      }} className="text-gray-600 hover:text-red-400 transition-colors cursor-pointer bg-transparent border-0 p-0">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                      </button>
                    )}
                  </div>
                </div>
                {c.comment && <p className="text-sm text-gray-400 leading-relaxed ml-12">{c.comment}</p>}
              </div>
            ))}
          </div>
        )}
{lightbox !== null && mediaItems?.images?.[lightbox] && (
  <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center" onClick={() => setLightbox(null)}>
    <button onClick={() => setLightbox(null)} className="absolute top-5 right-5 z-10 w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white/80 hover:text-white rounded-full transition-all cursor-pointer backdrop-blur-sm border border-white/20 text-lg">?</button>
    {lightbox > 0 && (
      <button onClick={e => { e.stopPropagation(); setLightbox(lightbox - 1) }} className="absolute left-5 z-10 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white/80 hover:text-white rounded-full transition-all cursor-pointer backdrop-blur-sm border border-white/20">
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
      </button>
    )}
    {lightbox < mediaItems.images.length - 1 && (
      <button onClick={e => { e.stopPropagation(); setLightbox(lightbox + 1) }} className="absolute right-5 z-10 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white/80 hover:text-white rounded-full transition-all cursor-pointer backdrop-blur-sm border border-white/20">
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
      </button>
    )}
    <img
      src={`https://image.tmdb.org/t/p/original${mediaItems.images[lightbox].file_path}`}
      alt=""
      className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
      onClick={e => e.stopPropagation()}
    />
  </div>
)}
{videoPlayer && (
  <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center" onClick={() => setVideoPlayer(null)}>
    <button onClick={() => setVideoPlayer(null)} className="absolute top-5 right-5 z-10 w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white/80 hover:text-white rounded-full transition-all cursor-pointer backdrop-blur-sm border border-white/20 text-lg">?</button>
    <div className="w-full max-w-5xl aspect-video p-4" onClick={e => e.stopPropagation()}>
      <iframe
        src={`https://www.youtube.com/embed/${videoPlayer}?autoplay=1&rel=0`}
        allow="autoplay; encrypted-media"
        allowFullScreen
        className="w-full h-full rounded-xl border-0 shadow-2xl"
      />
    </div>
  </div>
)}
      </div>
    </div>
  )
}
