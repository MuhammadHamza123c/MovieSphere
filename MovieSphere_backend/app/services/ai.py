from groq import Groq
from app.core.config import GROQ_API_KEY

_client = None

def get_client():
    global _client
    if _client is None:
        if not GROQ_API_KEY:
            raise ValueError("GROQ_API_KEY is not set in environment variables")
        _client = Groq(api_key=GROQ_API_KEY)
    return _client

def ask_ai_movie(text: str):
    client = get_client()
    prompt = """"You are a movie and TV show identification engine.

Task:
You will receive an overview, reference, description, or short storyline of a movie, TV show, web series, or animated series.

Rules:
- Identify the most likely matching title.
- Return ONLY the official name of the movie or TV show.
- Do NOT add explanations, descriptions, years, emojis, punctuation, or extra text.
- If multiple versions exist, return the most popular or original one.
- If it is a TV show or series, return the series name only.
- If you are unsure, return the single best guess.
- If nothing matches confidently, return nothing (empty string)."""
    chat_completion = client.chat.completions.create(
        messages=[
            {
                "role": "system",
                "content": prompt
            },
            {
                "role": "user",
                "content": text,
            }
        ],
        model="llama-3.3-70b-versatile",
        temperature=0.6
    )
    return chat_completion.choices[0].message.content


def ai_detail(data_store: list):
    client = get_client()
    movie = data_store[0]
    llm_input = "\n".join(
        f"{k.replace('_', ' ')}: {v}"
        for k, v in movie.items()
        if v is not None
    )
    prompt = """"You are a movie and TV show understanding engine.

Input:
You will receive structured or semi-structured metadata about a movie or TV show. 
The data may include (but is not limited to):
- Title
- Tagline
- Overview
- Budget
- Revenue
- Popularity
- Release_date / Air_date
- Runtime
- Season_number
- Episode_number
- Episode_name

Task:
1. Infer which movie, TV series, or episode the data refers to.
2. Understand the story, genre, tone, and context using only the provided information.
3. Write a concise, natural-language summary that explains what the movie, TV show, or episode is about.

Output Rules:
- Output ONLY the summary.
- Do NOT mention the title, metadata, or how you inferred it.
- Do NOT include bullet points, headings, or extra explanations.
- Do NOT add opinions or ratings.
- Keep the summary clear, coherent, and informative.
- Response should be less than 70 words and simple.

Output:
<summary only>
"""
    chat_completion = client.chat.completions.create(
        messages=[
            {
                "role": "system",
                "content": prompt
            },
            {
                "role": "user",
                "content": llm_input,
            }
        ],
        model="llama-3.3-70b-versatile"
    )
    return chat_completion.choices[0].message.content


def ask_ai_pic(image: str):
    client = get_client()
    completion = client.chat.completions.create(
        model="meta-llama/llama-4-scout-17b-16e-instruct",
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "What you can see in the given image.You will get a image related to movie or tv show you have to tell whats the context behind given image in simple wods lss than 30."
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": image
                        }
                    }
                ]
            }
        ],
        temperature=1,
        max_completion_tokens=1024,
        top_p=1,
        stream=False,
        stop=None,
    )
    return completion.choices[0].message.content
