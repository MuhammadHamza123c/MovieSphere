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
  const { data } = await client.get('/MovieSphere/remove_fav', { params: { name } })
  return data
}

export async function fetchRecommendations(movieName) {
  const { data } = await client.get('/MovieSphere/Recommend', { params: { movie_name: movieName } })
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

export async function fetchBucket() {
  const { data } = await client.get('/MovieSphere/bucket')
  return data.MovieSphere || []
}

export async function addToBucket(id, mediaType) {
  const { data } = await client.post('/MovieSphere/add_bucket', null, { params: { id, media_type: mediaType } })
  return data.MovieSphere || {}
}

export async function removeFromBucket(id, mediaType) {
  const { data } = await client.delete('/MovieSphere/remove_bucket', { params: { id, media_type: mediaType } })
  return data.MovieSphere || {}
}

export async function checkInBucket(id, mediaType) {
  const { data } = await client.get('/MovieSphere/check_bucket', { params: { id, media_type: mediaType } })
  return data.MovieSphere || { in_bucket: false }
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
