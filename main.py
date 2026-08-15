import os
import json
from fastapi.middleware.cors import CORSMiddleware
import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel
from openai import OpenAI

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")


if not api_key:
    raise RuntimeError("GEMINI_API_KEY is not set")

client = OpenAI(
    api_key=api_key,
    base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
)


app = FastAPI(
    title="AI Music Finder API",
    description="Search for songs and find similar songs using AI.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SongSearchResult(BaseModel):
    id: str
    title: str
    artist: str
    album: str | None = None
    year: str | None = None
    artwork: str | None = None


class SongSearchResponse(BaseModel):
    query: str
    results: list[SongSearchResult]


class SongRequest(BaseModel):
    song: str


class SimilarSong(BaseModel):
    title: str
    artist: str
    reason: str


class RecommendationResponse(BaseModel):
    searched_song: str
    recommendations: list[SimilarSong]



@app.get("/")
def root():
    return {
        "message": "AI Music Finder API is running"
    }



@app.get("/health")
def health_check():
    return {
        "status": "ok"
    }



@app.get(
    "/songs/search",
    response_model=SongSearchResponse
)
async def search_songs(
    q: str = Query(
        ...,
        min_length=2,
        description="Song or artist search query"
    )
):

    query = q.strip()

    if not query:
        raise HTTPException(
            status_code=400,
            detail="Search query cannot be empty"
        )

    url = "https://itunes.apple.com/search"

    params = {
        "term": query,
        "entity": "song",
        "limit": 20,
        "country": "us"
    }

    try:

        async with httpx.AsyncClient(
            timeout=10.0
        ) as http:

            response = await http.get(
                url,
                params=params
            )

        response.raise_for_status()

        data = response.json()

    except httpx.HTTPStatusError as e:

        print(
            "iTunes HTTP error:",
            e.response.status_code,
            e.response.text
        )

        raise HTTPException(
            status_code=502,
            detail="Music search service returned an error"
        )

    except httpx.HTTPError as e:

        print(
            "iTunes connection error:",
            repr(e)
        )

        raise HTTPException(
            status_code=502,
            detail="Music search service is unavailable"
        )


    results = []

    seen = set()

    normalized_query = query.lower().strip()

    for item in data.get("results", []):

        title = item.get("trackName")
        artist = item.get("artistName")

        if not title or not artist:
            continue

        duplicate_key = (
            title.lower().strip(),
            artist.lower().strip()
        )

        if duplicate_key in seen:
            continue

        seen.add(duplicate_key)


        album = item.get("collectionName")

        year = None

        release_date = item.get("releaseDate")

        if release_date:
            year = release_date[:4]


        title_lower = title.lower()
        artist_lower = artist.lower()

        score = 0

        if title_lower == normalized_query:
            score += 200

        if artist_lower == normalized_query:
            score += 200

        combined = f"{title_lower} {artist_lower}"

        if normalized_query == combined:
            score += 250

        if normalized_query in title_lower:
            score += 100

        if normalized_query in artist_lower:
            score += 100

        for word in normalized_query.split():

            if word in title_lower:
                score += 30

            if word in artist_lower:
                score += 30

        if title_lower.startswith(normalized_query):
            score += 50

        if artist_lower.startswith(normalized_query):
            score += 50

        results.append(
            {
                "score": score,
                "song": SongSearchResult(
                    id=str(item.get("trackId")),
                    title=title,
                    artist=artist,
                    album=album,
                    year=year,
                    artwork=item.get("artworkUrl100")
                )
            }
        )

    results.sort(
        key=lambda x: x["score"],
        reverse=True
    )

    final_results = [
        item["song"]
        for item in results[:8]
    ]

    return SongSearchResponse(
        query=query,
        results=final_results
    )


@app.post(
    "/recommendations",
    response_model=RecommendationResponse
)
def get_recommendations(request: SongRequest):

    song = request.song.strip()

    if not song:
        raise HTTPException(
            status_code=400,
            detail="Song name cannot be empty"
        )

    prompt = f"""
You are an expert music recommendation assistant.

The user selected this exact song:

{song}

Recommend exactly 5 songs that are musically similar.

Consider:

- genre
- mood
- atmosphere
- production
- instrumentation
- vocals
- songwriting
- overall sound

Do not recommend the exact song the user selected.

Return ONLY valid JSON in this exact format:

{{
    "recommendations": [
        {{
            "title": "Song title",
            "artist": "Artist name",
            "reason": "Short explanation of why this song is similar."
        }}
    ]
}}

There must be exactly 5 recommendations.
"""

    try:

        response = client.chat.completions.create(
            model="gemini-3.6-flash",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an expert music "
                        "recommendation assistant."
                    )
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.8,
        )
        content = response.choices[0].message.content

        if not content:
            raise HTTPException(
                status_code=500,
                detail="The AI returned an empty response"
            )

        data = json.loads(content)

        recommendations = data.get(
            "recommendations",
            []
        )

        if len(recommendations) != 5:
            raise HTTPException(
                status_code=500,
                detail=(
                    "The AI did not return "
                    "exactly 5 recommendations"
                )
            )

        return {
            "searched_song": song,
            "recommendations": recommendations
        }

    except json.JSONDecodeError:
        raise HTTPException(
            status_code=500,
            detail="The AI returned invalid JSON"
        )


    except Exception as e:

        print("AI REQUEST ERROR:", repr(e))

        raise