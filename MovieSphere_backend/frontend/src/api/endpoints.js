import client from './client'

export async function fetchHome(page = 1, genre = '') {
  const { data } = await client.get(`/MovieSphere/home/${page}`, { params: { genre } })
  return data.MovieSphere || []
}

export async function fetchShows(page = 1, genre = '') {
  const { data } = await client.get(`/MovieSphere/Shows/${page}`, { params: { genre } })
  return data.MovieSphere || []
}

export async function fetchGenres() {
  const { data } = await client.get('/MovieSphere/genres')
  return data.MovieSphere || { movie: [], tv: [] }
}

export async function fetchTopRated(type = 'movie', page = 1) {
  const { data } = await client.get('/MovieSphere/top_rated', { params: { type, page } })
  return data.MovieSphere || []
}

export async function fetchUpcoming(type = 'movie', page = 1) {
  const { data } = await client.get('/MovieSphere/upcoming', { params: { type, page } })
  return data.MovieSphere || []
}

export async function searchMovies(q) {
  const { data } = await client.get('/MovieSphere/Search', { params: { q } })
  return data.MovieSphere || []
}

export async function searchAiText(text) {
  const { data } = await client.get('/MovieSphere/Search', { params: { text } })
  return data.MovieSphere || []
}

export async function fetchFavorites() {
  const { data } = await client.get('/MovieSphere/favs')
  return data.favorites || []
}

export async function addFavorite(name) {
  const { data } = await client.post('/MovieSphere/add_fav', null, { params: { name } })
  return data
}

export async function removeFavorite(name) {
  const { data } = await client.post('/MovieSphere/remove_fav', null, { params: { name } })
  return data
}

export async function fetchWatchLater() {
  const { data } = await client.get('/MovieSphere/watch_later')
  return data.MovieSphere || []
}

export async function checkReleasedItems() {
  const { data } = await client.get('/MovieSphere/watch_later/releases')
  return data.MovieSphere || []
}

export async function fetchWatchLaterById(id) {
  const { data } = await client.get(`/MovieSphere/watch_later/${id}`)
  return data.MovieSphere
}

export async function updateWatchLater(id, body) {
  const { data } = await client.put(`/MovieSphere/watch_later/${id}`, body)
  return data.MovieSphere
}

export async function deleteWatchLaterById(id) {
  const { data } = await client.delete(`/MovieSphere/watch_later/${id}`)
  return data.MovieSphere
}

export async function addWatchLater(mediaId, mediaType) {
  const { data } = await client.post('/MovieSphere/add_watch_later', null, { params: { media_id: mediaId, media_type: mediaType } })
  return data.MovieSphere
}

export async function removeWatchLater(mediaId, mediaType) {
  const { data } = await client.delete('/MovieSphere/remove_watch_later', { params: { media_id: mediaId, media_type: mediaType } })
  return data.MovieSphere
}

export async function checkWatchLater(mediaId, mediaType) {
  const { data } = await client.get('/MovieSphere/check_watch_later', { params: { media_id: mediaId, media_type: mediaType } })
  return data.MovieSphere
}

export async function fetchRecommendations(movieName) {
  const { data } = await client.get('/MovieSphere/Recommend', { params: { movie_name: movieName } })
  return data.MovieSphere || []
}

export async function fetchSimilar(id, type) {
  const { data } = await client.get('/MovieSphere/similar', { params: { id, type } })
  return data.MovieSphere || []
}

export async function fetchDetail(name, id, type) {
  const { data } = await client.get('/MovieSphere/detail', { params: { name, id, type } })
  const raw = data.MovieSphere || data
  return Array.isArray(raw) && raw.length ? raw[0] : raw
}

export async function fetchCast(name, id, type) {
  const { data } = await client.get('/MovieSphere/cast', { params: { name, id, type } })
  return data.MovieSphere || []
}

export async function fetchActor(id) {
  const { data } = await client.get('/MovieSphere/cast/actor', { params: { id } })
  const raw = data.MovieSphere || data
  return Array.isArray(raw) && raw.length ? raw[0] : raw
}

export async function fetchComments(movieId, mediaType) {
  const { data } = await client.get('/MovieSphere/comments', { params: { movie_id: movieId, media_type: mediaType } })
  return data.comments || []
}

export async function postComment(movieId, mediaType, rating, comment) {
  const { data } = await client.post('/MovieSphere/comment', { movie_id: movieId, media_type: mediaType, rating, comment })
  return data.comment
}

export async function deleteComment(id) {
  const { data } = await client.delete('/MovieSphere/comment', { params: { id } })
  return data.comment
}

export async function getStreamUrl(id, season, epi) {
  const params = { id }
  if (season != null) params.season = season
  if (epi != null) params.epi = epi
  const { data } = await client.get('/MovieSphere/streamit', { params })
  return data.MovieSphere
}

export async function fetchHistoryRecs() {
  const { data } = await client.get('/MovieSphere/hist_rec')
  return data.MovieSphere || []
}


export async function askAi(id, season, epi) {
  const params = { id }
  if (season != null) params.season = season
  if (epi != null) params.epi = epi
  const { data } = await client.post('/MovieSphere/streamit/ask_it', null, { params })
  return data.MovieSphere
}

export async function askAiWithImage(file) {
  const formData = new FormData()
  formData.append('f1', file)
  const { data } = await client.post('/MovieSphere/streamit/ask_it', formData)
  return data.MovieSphere
}

export async function fetchSeasonEpisodes(id, season) {
  const { data } = await client.get('/MovieSphere/season_episodes', { params: { id, season } })
  return data.episodes || []
}

export async function fetchContinueWatching() {
  const { data } = await client.get('/MovieSphere/continue-watching')
  return data.MovieSphere || []
}

export async function saveProgress(payload) {
  await client.put('/MovieSphere/continue-watching/progress', payload)
}

export async function fetchMedia(id, type) {
  const { data } = await client.get('/MovieSphere/media', { params: { id, type } })
  return data.MovieSphere || { images: [], videos: [] }
}

export async function getWatchPartyToken(room, identity) {
  const { data } = await client.post('/MovieSphere/watch-party/token', null, { params: { room, identity } })
  return data
}
