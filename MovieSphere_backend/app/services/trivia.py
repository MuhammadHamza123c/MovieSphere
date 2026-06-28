import random
import requests
from app.core.config import TMDB_API_KEY
from app.utils.genres import tmdb_movie_genres, tmdb_tv_genres

QUIZ_SIZE = 5
TIME_LIMIT_SECONDS = 10
CREDITS_PER_CORRECT = 2

QUESTION_TYPES = ('year', 'genre', 'director')

# Known directors as fallback distractors
KNOWN_DIRECTORS = [
    'Christopher Nolan', 'Steven Spielberg', 'Martin Scorsese', 'Quentin Tarantino',
    'Denis Villeneuve', 'Greta Gerwig', 'Jordan Peele', 'Taika Waititi',
    'Wes Anderson', 'David Fincher', 'Ridley Scott', 'James Cameron',
    'Spike Lee', 'Kathryn Bigelow', 'Guillermo del Toro', 'Bong Joon-ho',
    'Alfonso Cuarón', 'Damien Chazelle', 'Ari Aster', 'Robert Eggers',
]


def _fetch_trending_items():
    items = []
    for media_type in ('movie', 'tv'):
        r = requests.get(
            f'https://api.themoviedb.org/3/{media_type}/popular',
            params={'api_key': TMDB_API_KEY, 'language': 'en-US', 'region': 'US'},
            timeout=8,
        )
        if r.ok:
            for item in (r.json().get('results') or []):
                if item.get('vote_count', 0) < 200:
                    continue
                items.append({
                    'id': item.get('id'),
                    'title': item.get('title') or item.get('name'),
                    'release_date': item.get('release_date') or item.get('first_air_date'),
                    'genre_ids': item.get('genre_ids') or [],
                    'media_type': media_type,
                    'popularity': item.get('popularity', 0),
                    'vote_count': item.get('vote_count', 0),
                })
    random.shuffle(items)
    return items


def _get_year_distractors(correct_year, count=3):
    candidates = [str(correct_year + i) for i in range(-8, 9) if i != 0]
    random.shuffle(candidates)
    return [str(y) for y in sorted(candidates[:count])]


def _get_genre_distractors(correct_genre, genre_map, count=3):
    all_genres = list(set(genre_map.values()))
    if correct_genre in all_genres:
        all_genres.remove(correct_genre)
    random.shuffle(all_genres)
    return all_genres[:count]


def _get_director(media_id, media_type):
    try:
        if media_type == 'movie':
            r = requests.get(
                f'https://api.themoviedb.org/3/movie/{media_id}/credits',
                params={'api_key': TMDB_API_KEY},
                timeout=5,
            )
            if r.ok:
                for person in (r.json().get('crew') or []):
                    if person.get('job') == 'Director':
                        return person.get('name')
        else:
            r = requests.get(
                f'https://api.themoviedb.org/3/tv/{media_id}',
                params={'api_key': TMDB_API_KEY},
                timeout=5,
            )
            if r.ok:
                creators = r.json().get('created_by') or []
                if creators:
                    return creators[0].get('name')
    except:
        pass
    return None


def _get_director_distractors(correct_director, count=3):
    pool = [d for d in KNOWN_DIRECTORS if d != correct_director]
    random.shuffle(pool)
    return pool[:count]


def generate_questions():
    items = _fetch_trending_items()
    if len(items) < QUIZ_SIZE:
        items = items * (QUIZ_SIZE // len(items) + 1)

    selected = items[:QUIZ_SIZE]
    questions = []
    types_used = list(QUESTION_TYPES)
    random.shuffle(types_used)

    for i, item in enumerate(selected):
        qtype = types_used[i % len(types_used)]
        title = item['title'] or 'Unknown'
        media_type = item['media_type']
        genre_map = tmdb_movie_genres if media_type == 'movie' else tmdb_tv_genres

        if qtype == 'year':
            raw = item.get('release_date', '')
            year = raw[:4] if len(raw) >= 4 else None
            if not year or not year.isdigit():
                qtype = 'genre'

        if qtype == 'genre':
            gids = item.get('genre_ids', [])
            correct_genre = genre_map.get(gids[0]) if gids else None
            if not correct_genre:
                qtype = 'director'

        if qtype == 'director':
            director = _get_director(item['id'], media_type)
            if not director:
                qtype = 'year'
                raw = item.get('release_date', '')
                year = raw[:4] if len(raw) >= 4 else None
                if not year or not year.isdigit():
                    qtype = 'genre'
                    gids = item.get('genre_ids', [])
                    correct_genre = genre_map.get(gids[0]) if gids else None
                    if not correct_genre:
                        continue

        # Build question based on resolved type
        if qtype == 'year':
            raw = item.get('release_date', '')
            correct_answer = str(raw[:4])
            question_text = f'What year was "{title}" released?'
            distractors = _get_year_distractors(int(correct_answer))
            correct = correct_answer
        elif qtype == 'genre':
            gids = item.get('genre_ids', [])
            correct_answer = genre_map.get(gids[0], 'Unknown')
            question_text = f'What genre is "{title}"?'
            distractors = _get_genre_distractors(correct_answer, genre_map)
            correct = correct_answer
        elif qtype == 'director':
            correct_answer = director
            question_text = f'Who directed "{title}"?'
            distractors = _get_director_distractors(correct_answer)
            correct = correct_answer
        else:
            continue

        options = distractors + [correct]
        random.shuffle(options)
        correct_index = options.index(correct)

        questions.append({
            'question': question_text,
            'options': options,
            'correct_index': correct_index,
            'type': qtype,
            'media_title': title,
            'media_type': media_type,
            'media_id': item['id'],
        })

    if len(questions) < QUIZ_SIZE:
        questions = questions * (QUIZ_SIZE // len(questions) + 1)
    return questions[:QUIZ_SIZE]


def check_answer(questions, question_index, selected_index, time_taken):
    if question_index < 0 or question_index >= len(questions):
        return {'correct': False, 'credits_earned': 0}
    q = questions[question_index]
    is_correct = (
        selected_index == q['correct_index']
        and time_taken <= TIME_LIMIT_SECONDS
    )
    return {
        'correct': is_correct,
        'credits_earned': CREDITS_PER_CORRECT if is_correct else 0,
        'correct_index': q['correct_index'],
    }
