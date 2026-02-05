from fastapi import FastAPI
from fastapi.responses import RedirectResponse
from app.routers.members import router as members_router

app = FastAPI(title="AI Note Knowledge Backend")

@app.get("/", include_in_schema=False)
async def redirect_to_docs():
    return RedirectResponse(url="/docs")

app.include_router(members_router)