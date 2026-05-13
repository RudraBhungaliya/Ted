from app.services.ai.context import build_context
from app.services.ai.prompt import build_prompt
from app.services.ai.llm import llm_service

async def run_pipeline(query : str):
    context = build_context(query)
    prompt = build_prompt(context["query"])
    
    async for token in llm_service.stream_response(prompt) :
        yield token