import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.journal_service import JournalService
from backend.api import entries, search, tags
from backend.schemas import RenderRequest, RenderResponse
from backend.markup import convert_to_html

logging.basicConfig(level=logging.INFO)

DATA_DIR = os.environ.get("REDNOTEBOOK_DATA_DIR", "~/.rednotebook/data")
FRONTEND_DIST = os.environ.get("FRONTEND_DIST", str(Path(__file__).parent.parent / "frontend" / "dist"))


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.journal = JournalService(DATA_DIR)
    app.state.journal.load()
    logging.info(f"Loaded journal from {DATA_DIR}")
    yield


app = FastAPI(title="RedNotebook Web", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(entries.router, prefix="/api")
app.include_router(search.router, prefix="/api")
app.include_router(tags.router, prefix="/api")


@app.post("/api/render", response_model=RenderResponse)
async def render_markup(body: RenderRequest):
    html = convert_to_html(body.text)
    return RenderResponse(html=html)


@app.get("/api/health")
async def health():
    return {"status": "ok"}


# Serve frontend static files if built
frontend_path = Path(FRONTEND_DIST)
if frontend_path.exists():
    app.mount("/", StaticFiles(directory=str(frontend_path), html=True), name="frontend")
