from fastapi import APIRouter, HTTPException, Query, Header, Depends
from datetime import date
from app.core.database import supabase
from app.services.trivia import generate_questions, check_answer, QUIZ_SIZE, TIME_LIMIT_SECONDS, CREDITS_PER_CORRECT
from app.core.auth import _verify_token_locally
from app.core.credits import add_credits

trivia_app = APIRouter()


def _get_user_id(token: str) -> str | None:
    payload = _verify_token_locally(token)
    if payload:
        return payload.get('sub')
    try:
        user = supabase.auth.get_user(token)
        if user and user.user:
            return user.user.id
    except:
        pass
    return None


def _resolve_user(authorization: str = Header('')) -> str:
    token = authorization.removeprefix('Bearer ').strip()
    if not token:
        raise HTTPException(status_code=401, detail='Missing Authorization header')
    user_id = _get_user_id(token)
    if not user_id:
        raise HTTPException(status_code=401, detail='Unauthorized')
    return user_id


@trivia_app.get('/MovieSphere/trivia/today')
async def get_today_trivia(user_id: str = Depends(_resolve_user)):
    today = date.today().isoformat()

    existing = supabase.table('user_trivia_scores').select('*').eq('user_id', user_id).eq('quiz_date', today).execute()
    if existing.data:
        s = existing.data[0]
        return {
            'completed': True,
            'total_correct': s.get('total_correct', 0),
            'total_questions': s.get('total_questions', 0),
            'credits_earned': s.get('credits_earned', 0),
        }

    questions = await generate_questions()

    supabase.table('user_trivia_sessions').upsert({
        'user_id': user_id,
        'questions': questions,
    }).execute()

    safe = []
    for q in questions:
        safe.append({
            'question': q['question'],
            'options': q['options'],
            'type': q.get('type'),
            'media_title': q.get('media_title'),
        })

    return {'completed': False, 'questions': safe}


@trivia_app.post('/MovieSphere/trivia/submit')
def submit_trivia(payload: dict, user_id: str = Depends(_resolve_user)):
    today = date.today().isoformat()

    existing = supabase.table('user_trivia_scores').select('*').eq('user_id', user_id).eq('quiz_date', today).execute()
    if existing.data:
        supabase.table('user_trivia_sessions').delete().eq('user_id', user_id).execute()
        return {'already_completed': True, 'credits_earned': existing.data[0].get('credits_earned', 0)}

    session = supabase.table('user_trivia_sessions').select('*').eq('user_id', user_id).execute()
    if not session.data:
        raise HTTPException(status_code=404, detail='No active trivia session. Fetch questions first.')

    questions_raw = session.data[0].get('questions')
    if isinstance(questions_raw, str):
        import json
        questions = json.loads(questions_raw)
    else:
        questions = questions_raw

    supabase.table('user_trivia_sessions').delete().eq('user_id', user_id).execute()

    answers = payload.get('answers', [])
    if len(answers) != QUIZ_SIZE:
        raise HTTPException(status_code=400, detail=f'Expected {QUIZ_SIZE} answers')

    total_correct = 0
    credits_earned = 0
    results = []

    for i, ans in enumerate(answers):
        selected = ans.get('selected_index', -1)
        time_taken = ans.get('time_taken', TIME_LIMIT_SECONDS + 1)
        result = check_answer(questions, i, selected, time_taken)
        results.append({
            'correct': result['correct'],
            'credits_earned': result['credits_earned'],
        })
        if result['correct']:
            total_correct += 1
            credits_earned += result['credits_earned']

    if credits_earned > 0:
        add_credits(user_id, credits_earned)

    supabase.table('user_trivia_scores').insert({
        'user_id': user_id,
        'quiz_date': today,
        'total_correct': total_correct,
        'total_questions': QUIZ_SIZE,
        'credits_earned': credits_earned,
    }).execute()

    return {
        'completed': True,
        'total_correct': total_correct,
        'total_questions': QUIZ_SIZE,
        'credits_earned': credits_earned,
        'results': results,
    }
