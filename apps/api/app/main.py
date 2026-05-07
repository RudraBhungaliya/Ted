from fastapi import FastAPI
from app.api.health import router as health_router
from app.api.interview import router as interview_router

app = FastAPI(
    title = "Ted API",
    version = "1.0.0"
)

app.include_router(health_router)
app.include_router(interview_router)

@app.ger("/")
async def root () : 
    return{
        "status" : "running"
    }