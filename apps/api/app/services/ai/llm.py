from app.services.ai.providers.grok import GrokProvider


class LLMService:

    def __init__(self):

        self.provider = GrokProvider()

    async def generate_response(
        self,
        prompt: str,
        system_prompt: str | None = None,
        temperature: float = 0.7,
    ) -> str:

        return await self.provider.generate_response(
            prompt=prompt,
            system_prompt=system_prompt,
            temperature=temperature,
        )


llm_service = LLMService()