from fastapi import FastAPI

from app.routers.members import router as members_router

app = FastAPI(title="AI Note Knowledge Backend")

app.include_router(members_router)
