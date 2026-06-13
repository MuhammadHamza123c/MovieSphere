import requests
from app.core.config import GIPHY_API_KEY


def search_gifs(query: str, limit: int = 8):
    if not GIPHY_API_KEY:
        return []
    url = "https://api.giphy.com/v1/gifs/search"
    params = {
        'api_key': GIPHY_API_KEY,
        'q': f"{query} movie",
        'limit': limit,
        'rating': 'g',
        'lang': 'en'
    }
    resp = requests.get(url, params=params)
    if not resp.ok:
        return []
    data = resp.json()
    results = []
    for gif in data.get('data', []):
        images = gif.get('images', {})
        results.append({
            'id': gif.get('id'),
            'title': gif.get('title', ''),
            'url': gif.get('url'),
            'thumbnail': images.get('fixed_height', {}).get('url'),
            'original': images.get('original', {}).get('url')
        })
    return results
