from openai import AsyncOpenAI 

from app.core.settings import settings

client = AsyncOpenAI(
    api_key = settings.OPENAI_API_KEY
)

async def get_response(prompt : str) -> str :
    stream = await client.chat.completions.create(
        model=settings.MODEL_NAME,
        messages=[
            {
                "role" : "user",
                "content" : prompt
            }
        ],
        stream = True
    )
    
    async for chunk in stream :
        delta = chunk.choices[0].delta.content
        
        if delta : 
            yield delta
    