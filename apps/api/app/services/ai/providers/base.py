from abc import ABC, abstractmethod

class BaseLLMProvider(ABC):

    @abstractmethod
    async def generate_response(
        self,
        prompt: str,
        system_prompt: str | None = None,
        temperature: float = 0.7,
    ) -> str:
        pass