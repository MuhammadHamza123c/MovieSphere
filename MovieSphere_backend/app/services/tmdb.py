import requests
from app.core.config import TMDB_API_KEY
from app.utils.genres import tmdb_movie_genres, tmdb_tv_genres


def get_movies_series(page_number: int, genre_id: str = ''):
    data_list = []
    if genre_id:
        url = "https://api.themoviedb.org/3/discover/movie"
        params = {'api_key': TMDB_API_KEY, 'page': page_number, 'with_genres': genre_id, 'language': 'en-US', 'sort_by': 'popularity.desc'}
    else:
        url = "https://api.themoviedb.org/3/movie/now_playing"
        params = {'api_key': TMDB_API_KEY, 'page': page_number, 'language': 'en-US'}
    response = requests.get(url=url, params=params)
    data = response.json()
    result = data.get('results') or []
    data_list = [
        {
            'Id': result[i]['id'],
            'Title': result[i]['title'],
            'Release_date': result[i]['release_date'],
            'Genre': '|'.join([tmdb_movie_genres.get(genre_id, 'Unknown') for genre_id in result[i]['genre_ids']]),
            'Popularity': result[i]['popularity'],
            'Poster_path': f"https://image.tmdb.org/t/p/w500{result[i]['poster_path']}"
        }
        for i in range(0, min(16, len(result)))]
    return data_list


def tv_shows_get(page_number: int, genre_id: str = ''):
    data_list = []
    if genre_id:
        url = "https://api.themoviedb.org/3/discover/tv"
        params = {'api_key': TMDB_API_KEY, 'page': page_number, 'with_genres': genre_id, 'language': 'en-US', 'sort_by': 'popularity.desc'}
    else:
        url = "https://api.themoviedb.org/3/tv/popular"
        params = {'api_key': TMDB_API_KEY, 'page': page_number, 'language': 'en-US'}
    response = requests.get(url, params=params)
    data = response.json()
    result = data.get('results') or []
    data_list = [
        {
            'Id': result[i].get('id'),
            'Title': result[i].get('name'),
            'Starting Date': result[i].get('first_air_date'),
            'Genre': '|'.join([tmdb_tv_genres.get(genre_ids, 'Unknown') for genre_ids in result[i].get('genre_ids')]),
            'Popularity': result[i].get('popularity'),
            'Poster_path': (
                f"https://image.tmdb.org/t/p/w500{result[i]['poster_path']}"
                if result[i].get('poster_path')
                else "https://znuiuhxyhpgqmdftansc.supabase.co/storage/v1/object/public/user_files/images/no_image_avail.png"
            ),
            'media_type': 'tv'
        }
        for i in range(0, min(16, len(result)))]
    return data_list


def search_it(q: str):
    data_list = []
    url = "https://api.themoviedb.org/3/search/multi"
    response = requests.get(
        url=url,
        params={
            'api_key': TMDB_API_KEY,
            'query': q
        }
    )
    data = response.json()
    result = data['results']
    length_total = len(result)
    if length_total > 0:
        if length_total > 3:
            length_total = 3
        data_list = [
            {
                'Id': result[i]['id'],
                'Title': result[i].get('title') or result[i].get('name'),
                'media_type': result[i].get('media_type', []),
                'Release_date': result[i].get('release_date') or result[i].get('first_air_date'),
                'Genre': '|'.join([
                    tmdb_movie_genres.get(genre_id, tmdb_tv_genres.get(genre_id, 'Unknown'))
                    for genre_id in (result[i].get('genre_ids') or [])
                ]) or 'None',
                'Popularity': result[i]['popularity'],
                'Poster_path': (
                    f"https://image.tmdb.org/t/p/w500{result[i]['poster_path']}"
                    if result[i].get('poster_path')
                    else "https://znuiuhxyhpgqmdftansc.supabase.co/storage/v1/object/public/user_files/images/no_image_avail.png"
                )
            }
            for i in range(0, length_total)]
    else:
        data_list = ['No Movie Found']
    return data_list


def single_detail(names: list[str]):
    show_fav = []
    for i in range(0, len(names)):
        url = "https://api.themoviedb.org/3/search/multi"
        response = requests.get(url=url, params={
            'api_key': TMDB_API_KEY,
            'language': 'en-US',
            'query': names[i]
        })
        data = response.json()
        result = data['results']
        genre_ids = result[0].get('genre_ids', [])
        media_type = result[0].get('media_type', [])
        if media_type == 'tv':
            genre_real = [tmdb_tv_genres.get(kk, 'Unknown') for kk in genre_ids]
        else:
            genre_real = [tmdb_movie_genres.get(kk, 'Unknown') for kk in genre_ids]
        show_fav.append({
            'Id': result[0].get('id'),
            'Title': result[0].get('title') or result[0].get('name'),
            'Release_date': result[0].get('release_date') or result[0].get('first_air_date'),
            'Genre': '|'.join(genre_real),
            'Popularity': result[0].get('popularity'),
            'Poster_path': (
                f"https://image.tmdb.org/t/p/w500{result[0].get('poster_path')}"
                if result[0].get('poster_path')
                else "https://znuiuhxyhpgqmdftansc.supabase.co/storage/v1/object/public/user_files/images/no_image_avail.png"
            )
        })
    return show_fav


def recomend_me(name: str):
    data_list = []
    url = "https://api.themoviedb.org/3/search/multi"
    response = requests.get(url=url, params={
        'api_key': TMDB_API_KEY,
        'query': name
    })
    data = response.json()
    media_type = data['results'][0]['media_type']
    id = data['results'][0]['id']
    if media_type == 'tv':
        url_tv = f"https://api.themoviedb.org/3/tv/{id}/recommendations"
        response_tv = requests.get(url_tv, params={
            'api_key': TMDB_API_KEY,
            'language': 'en-US',
            'page': 1
        })
        data = response_tv.json()
    else:
        url_tv = f"https://api.themoviedb.org/3/movie/{id}/recommendations"
        response_movie = requests.get(url_tv, params={
            'api_key': TMDB_API_KEY,
            'language': 'en-US',
            'page': 1
        })
        data = response_movie.json()
    result = data['results']
    data_list = [
        {
            'Id': result[i].get('id'),
            'Title': result[i].get('title') or result[i].get('name'),
            'Release_date': result[i].get('release_date') or result[i].get('first_air_date'),
            'Genre': '|'.join([
                tmdb_movie_genres.get(genre_id, tmdb_tv_genres.get(genre_id, 'Unknown'))
                for genre_id in (result[i].get('genre_ids') or [])
            ]) or 'None',
            'Popularity': result[i].get('popularity'),
            'Poster_path': (
                f"https://image.tmdb.org/t/p/w500{result[i].get('poster_path')}"
                if result[i].get('poster_path')
                else "https://znuiuhxyhpgqmdftansc.supabase.co/storage/v1/object/public/user_files/images/no_image_avail.png"
            )
        }
        for i in range(0, 8)]
    return data_list


def get_info(name: str, id: int, type: str = ''):
    data_list = []
    if type:
        media_type = type
    elif not name or not name.strip():
        r = requests.get(f"https://api.themoviedb.org/3/movie/{id}", params={'api_key': TMDB_API_KEY})
        if r.ok and r.json().get('id'):
            media_type = 'movie'
        else:
            r = requests.get(f"https://api.themoviedb.org/3/tv/{id}", params={'api_key': TMDB_API_KEY})
            media_type = 'tv' if r.ok and r.json().get('id') else 'movie'
    else:
        url = "https://api.themoviedb.org/3/search/multi"
        response = requests.get(url=url, params={'api_key': TMDB_API_KEY, 'query': name})
        data = response.json()
        if not data.get('results'):
            return data_list
        media_type = data['results'][0]['media_type']
        id = data['results'][0]['id']
    if media_type == 'tv':
        url_tv = f"https://api.themoviedb.org/3/tv/{id}/credits"
        response_tv = requests.get(
            url=url_tv,
            params={
                'api_key': TMDB_API_KEY
            }
        )
        data = response_tv.json()
    else:
        url_movie = f"https://api.themoviedb.org/3/movie/{id}/credits"
        response_movie = requests.get(
            url=url_movie, params={
                'api_key': TMDB_API_KEY
            }
        )
        data = response_movie.json()
    result = data.get('cast') or []
    data_list = [
        {
            'Id': result[i].get('id'),
            'Name': result[i].get('original_name', 'Unknown'),
            'Gender': 'Male' if result[i].get('gender') == 2 else 'Female',
            'Popularity': result[i].get('popularity', 'Unknown'),
            'Profile_path': f"https://image.tmdb.org/t/p/w500{result[i].get('profile_path', 'Unknown')}",
            'Character_play': result[i].get('character', 'Unknown')
        }
        for i in range(min(8, len(result)))]
    return data_list


def info_now(name: str, id: int):
    data_list = []
    seasons_list = []

    if not name or not name.strip():
        r = requests.get(f"https://api.themoviedb.org/3/tv/{id}", params={'api_key': TMDB_API_KEY})
        if r.ok and r.json().get('id'):
            media_type = 'tv'
        else:
            media_type = 'movie'
    else:
        url = "https://api.themoviedb.org/3/search/multi"
        response = requests.get(url=url, params={'api_key': TMDB_API_KEY, 'query': name})
        data = response.json()
        if not data.get('results'):
            return data_list
        media_type = data['results'][0]['media_type']
    if media_type == "tv":
        tv_url = f"https://api.themoviedb.org/3/tv/{id}"
        response_tv = requests.get(
            url=tv_url,
            params={
                'api_key': TMDB_API_KEY
            }
        )
        data = response_tv.json()
        for season in data.get('seasons', []):
            if season.get('season_number') != 0:
                season_info = {
                    "season_number": season.get('season_number'),
                    "episode_count": season.get('episode_count'),
                }
                seasons_list.append(season_info)
        data_list.append(
            {
                'Title': data.get('name') or data.get('original_name'),
                'Id': data.get('id'),
                'Popularity': data.get('popularity'),
                'Poster_path': f"https://image.tmdb.org/t/p/w500{data.get('poster_path')}" if data.get('poster_path') else None,
                'Overview': data.get('overview'),
                'Genre': '|'.join([genre.get('name') for genre in data.get('genres', [])]),
                'Status': data.get('status'),
                'Tagline': data.get('tagline'),
                'Seasons/Episode': seasons_list
            }
        )
    else:
        movie_url = f"https://api.themoviedb.org/3/movie/{id}"
        response_movie = requests.get(
            url=movie_url,
            params={
                'api_key': TMDB_API_KEY
            }
        )
        data = response_movie.json()
        data_list.append(
            {
                'Title': data.get('title') or data.get('original_title()'),
                'Id': id,
                'Popularity': data.get('popularity'),
                'Poster_path': f"https://image.tmdb.org/t/p/w500{data.get('poster_path')}" if data.get('poster_path') else None,
                'Overview': data.get('overview'),
                'Genre': '|'.join([genre.get('name') for genre in data.get('genres', [])]),
                'Status': data.get('status'),
                'Tagline': data.get('tagline')
            }
        )
    return data_list


def get_top_rated(type: str, page: int):
    data_list = []
    if type == 'tv':
        url = "https://api.themoviedb.org/3/tv/top_rated"
        genre_map = tmdb_tv_genres
        title_key = 'name'
        date_key = 'first_air_date'
    else:
        url = "https://api.themoviedb.org/3/movie/top_rated"
        genre_map = tmdb_movie_genres
        title_key = 'title'
        date_key = 'release_date'
    response = requests.get(url, params={'api_key': TMDB_API_KEY, 'page': page, 'language': 'en-US'})
    data = response.json()
    result = data.get('results') or []
    for i in range(min(16, len(result))):
        item = result[i]
        data_list.append({
            'Id': item.get('id'),
            'Title': item.get(title_key),
            'Release_date': item.get(date_key),
            'Genre': '|'.join([genre_map.get(gid, 'Unknown') for gid in item.get('genre_ids', [])]),
            'Popularity': item.get('vote_average', 0),
            'Poster_path': f"https://image.tmdb.org/t/p/w500{item.get('poster_path')}" if item.get('poster_path') else None,
            'media_type': type
        })
    return data_list


def watch_movie(id: int):
    return f"https://vidlink.pro/movie/{id}?poster=true&title=true"


def watch_tv(id: int, season: int, epi: int):
    return f"https://vidlink.pro/tv/{id}/{season}/{epi}?poster=true&title=true"


def actor_it(id: int):
    data_list = []
    work_list = []
    url = f"https://api.themoviedb.org/3/person/{id}"
    response = requests.get(url=url, params={
        'api_key': TMDB_API_KEY,
        "append_to_response": "movie_credits,tv_credits,images"
    })
    data = response.json()
    gender_get = 'Male' if data.get('gender') == 2 else 'Female'
    movies = data.get("movie_credits", {})
    movie_length = len(movies.get('cast'))
    if movie_length > 8:
        movie_length = 8
    work_list = [
        {
            'Id': movies.get('cast')[movie].get('id'),
            'Title': movies.get('cast')[movie].get("title"),
            'Release_date': movies.get('cast')[movie].get('release_date'),
            'Genre': '|'.join([tmdb_movie_genres.get(genre_id, tmdb_tv_genres.get(genre_id, 'Unknown')) for genre_id in movies.get('cast')[movie].get('genre_ids')]),
            'Popularity': movies.get('cast')[movie].get('popularity'),
            'Poster_path': (
                f"https://image.tmdb.org/t/p/w500{movies.get('cast')[movie].get('poster_path')}"
                if movies.get('cast')[movie].get('poster_path')
                else "https://znuiuhxyhpgqmdftansc.supabase.co/storage/v1/object/public/user_files/images/no_image_avail.png"
            )
        }
        for movie in range(movie_length)]
    data_list.append({
        'Name': data.get('name'),
        'Profile_pic': f"https://image.tmdb.org/t/p/w500{data.get('profile_path')}",
        'Biography': data.get('biography'),
        'Birthday': data.get('birthday'),
        'Gender': gender_get,
        'Known_for': data.get('known_for_department'),
        'Birth_place': data.get('place_of_birth'),
        'work_list': work_list
    })
    return data_list


def get_movie(id: int):
    data_store = []
    url = f"https://api.themoviedb.org/3/movie/{id}"
    response = requests.get(
        url=url, params={
            'api_key': TMDB_API_KEY
        }
    )
    data = response.json()
    data_store.append(
        {
            'Budget': data.get('budget'),
            'Overview': data.get('overview'),
            'Popularity': data.get('popularity'),
            'Release_date': data.get('release_date'),
            'Revenue': data.get('revenue'),
            'Tagline': data.get('tagline'),
            'Title': data.get('title')
        }
    )
    return data_store


def get_tv(id: int, season: int, epi: int):
    data_store = []
    url = f"https://api.themoviedb.org/3/tv/{id}/season/{season}/episode/{epi}"
    response = requests.get(
        url=url, params={
            'api_key': TMDB_API_KEY
        }
    )
    data = response.json()
    data_store.append(
        {
            'Air_date': data.get("air_date"),
            'Episode_name': data.get('name'),
            'Episode_number': data.get('episode_number'),
            'Season_number': data.get('season_number'),
            'Runtime': data.get('runtime'),
            'Overview': data.get('overview')
        }
    )
    return data_store


def select_latest_one(user_id: str):
    from app.core.database import supabase
    id_list = []
    response = supabase.table('user_exp').select('movie_id').eq('user_id', user_id).order("created_at", desc=True).limit(4).execute().data
    id_list = list(set([kk.get('movie_id') for kk in response]))
    result = get_like(id_list)
    return result


def get_like(id_list: list):
    store_list = []
    for tmdb_id in id_list:
        url_movie = f"https://api.themoviedb.org/3/movie/{tmdb_id}/recommendations?api_key={TMDB_API_KEY}&language=en-US&page=1"
        url_tv = f"https://api.themoviedb.org/3/tv/{tmdb_id}/recommendations?api_key={TMDB_API_KEY}&language=en-US&page=1"
        response = requests.get(url_movie)
        if response.status_code == 200:
            result = response.json().get("results", [])
            genre_map = tmdb_movie_genres
        else:
            response = requests.get(url_tv)
            if response.status_code == 200:
                result = response.json().get("results", [])
                genre_map = tmdb_tv_genres
            else:
                continue
        for rec in result[:2]:
            store_list.append({
                "Id": rec.get("id"),
                "Title": rec.get("title") or rec.get("name"),
                "Release_date": rec.get("release_date") or rec.get("first_air_date"),
                'Genre': '|'.join([
                    tmdb_movie_genres.get(genre_id, tmdb_tv_genres.get(genre_id, 'Unknown'))
                    for genre_id in (rec.get('genre_ids') or [])
                ]) or 'None',
                "Popularity": rec.get("popularity"),
                "Poster_path": f"https://image.tmdb.org/t/p/w500{rec.get('poster_path')}" if rec.get('poster_path') else None
            })
    return store_list
