import requests


def search_soundtrack(title: str, limit: int = 3):
    url = "https://itunes.apple.com/search"
    params = {
        'term': f"{title} soundtrack",
        'entity': 'album',
        'limit': limit,
        'media': 'music',
        'country': 'US',
    }
    resp = requests.get(url, params=params)
    if not resp.ok:
        return []
    data = resp.json()
    results = []
    for album in data.get('results', []):
        artwork = album.get('artworkUrl100', '')
        if artwork:
            artwork = artwork.replace('100x100bb', '600x600bb')
        results.append({
            'artist': album.get('artistName', ''),
            'album': album.get('collectionName', ''),
            'artwork': artwork,
            'url': album.get('collectionViewUrl', ''),
            'tracks': album.get('trackCount', 0),
            'release_date': album.get('releaseDate', '')[:4] if album.get('releaseDate') else '',
            'collection_id': album.get('collectionId'),
        })
    return results


def get_track_previews(collection_id: int):
    url = "https://itunes.apple.com/lookup"
    params = {
        'id': collection_id,
        'entity': 'song',
        'country': 'US',
    }
    resp = requests.get(url, params=params)
    if not resp.ok:
        return []
    data = resp.json()
    tracks = []
    for item in data.get('results', []):
        if item.get('wrapperType') == 'track':
            tracks.append({
                'name': item.get('trackName', ''),
                'preview': item.get('previewUrl', ''),
                'track_number': item.get('trackNumber', 0),
                'artist': item.get('artistName', ''),
            })
    return tracks
