from app.core.settings import Settings

class Config :
    OPENAI_API_KEY = settings.OPENAI_API_KEY
    DEEPGRAM_API_KEY = settings.DEEPGRAM_API_KEY
    GROK_API_KEY = settings.GROK_API_KEY
    MODEL_NAME = settings.MODEL_NAME
    DEBUG = settings.DEBUG

config = Config()