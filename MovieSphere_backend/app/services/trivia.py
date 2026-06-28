import json
import httpx
from app.core.config import GROQ_API_KEY

QUIZ_SIZE = 5
TIME_LIMIT_SECONDS = 10
CREDITS_PER_CORRECT = 2


async def _ask_groq(prompt: str, max_tokens: int = 1500) -> str | None:
    if not GROQ_API_KEY:
        return None
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            r = await client.post(
                'https://api.groq.com/openai/v1/chat/completions',
                headers={
                    'Authorization': f'Bearer {GROQ_API_KEY}',
                    'Content-Type': 'application/json',
                },
                json={
                    'model': 'llama-3.3-70b-versatile',
                    'messages': [{'role': 'user', 'content': prompt}],
                    'temperature': 0.9,
                    'max_tokens': max_tokens,
                },
            )
            if r.status_code != 200:
                print(f'[Groq] API error: {r.status_code} {r.text}', flush=True)
                return None
            text = r.json()['choices'][0]['message']['content'].strip()
            text = text.replace('```json', '').replace('```', '').replace('```json', '').strip()
            return text
    except Exception as e:
        print(f'[Groq] request failed: {e}', flush=True)
        return None


async def generate_questions():
    prompt = (
        "Generate 5 multiple-choice trivia questions about popular movies and TV shows. "
        "Each question must have exactly 4 options with exactly one correct answer. "
        "Use a wide variety of question types: release years, actors/actresses, directors, "
        "characters, plot details, box office, awards, episodes, seasons, etc. "
        "Mix well-known movies AND TV shows. "
        "Every generation must produce completely different questions — never repeat the same topic. "
        "Make the wrong answers plausible but clearly incorrect for anyone who knows the subject. "
        "\n\n"
        "Return ONLY valid JSON an array of 5 objects, each with these exact keys:\n"
        "  - question: string\n"
        "  - options: array of 4 strings\n"
        "  - correct_index: integer (0-3)\n"
        "  - type: string (year, actor, director, character, plot, box_office, awards, trivia)\n"
        "  - media_title: string\n"
        "\n"
        "Example:\n"
        '[\n'
        '  {"question":"In which year was The Dark Knight released?","options":["2006","2008","2010","2012"],"correct_index":1,"type":"year","media_title":"The Dark Knight"},\n'
        '  {"question":"Which actor played Iron Man?","options":["Chris Evans","Robert Downey Jr.","Chris Hemsworth","Mark Ruffalo"],"correct_index":1,"type":"actor","media_title":"Iron Man"}\n'
        ']'
    )

    text = await _ask_groq(prompt)

    if text:
        try:
            questions = json.loads(text)
            if isinstance(questions, list) and len(questions) > 0:
                validated = []
                for q in questions:
                    if all(k in q for k in ('question', 'options', 'correct_index', 'type', 'media_title')):
                        q['options'] = [str(o) for o in q['options'][:4]]
                        validated.append(q)
                if len(validated) >= QUIZ_SIZE:
                    return validated[:QUIZ_SIZE]
        except (json.JSONDecodeError, KeyError) as e:
            print(f'[Trivia] Failed to parse Groq response: {e}', flush=True)
            print(f'[Trivia] Raw: {text}', flush=True)

    return _fallback_questions()


def _fallback_questions():
    return [
        {
            'question': 'In which year was The Dark Knight released?',
            'options': ['2006', '2008', '2010', '2012'],
            'correct_index': 1,
            'type': 'year',
            'media_title': 'The Dark Knight',
        },
        {
            'question': 'Which actor played Tony Stark / Iron Man?',
            'options': ['Chris Evans', 'Robert Downey Jr.', 'Chris Hemsworth', 'Mark Ruffalo'],
            'correct_index': 1,
            'type': 'actor',
            'media_title': 'Iron Man',
        },
        {
            'question': 'Who directed Jurassic Park?',
            'options': ['James Cameron', 'Ridley Scott', 'Steven Spielberg', 'George Lucas'],
            'correct_index': 2,
            'type': 'director',
            'media_title': 'Jurassic Park',
        },
        {
            'question': 'What is the highest-grossing film of all time?',
            'options': ['Avengers: Endgame', 'Avatar', 'Titanic', 'Star Wars: The Force Awakens'],
            'correct_index': 1,
            'type': 'box_office',
            'media_title': 'Avatar',
        },
        {
            'question': 'Which TV show features a high school chemistry teacher who starts cooking meth?',
            'options': ['Ozark', 'Narcos', 'Breaking Bad', 'The Wire'],
            'correct_index': 2,
            'type': 'plot',
            'media_title': 'Breaking Bad',
        },
    ]


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
