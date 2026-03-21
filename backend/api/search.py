from fastapi import APIRouter, Request, Query
from typing import Optional
from backend.schemas import SearchResult

router = APIRouter()


@router.get("/search", response_model=list[SearchResult])
async def search(
    request: Request,
    q: Optional[str] = Query(default="", description="Text search query"),
    tag: Optional[str] = Query(default="", description="Filter by tag"),
):
    svc = request.app.state.journal
    raw = svc.search(query=q or "", tag=tag or "")
    return [SearchResult(**r) for r in raw]
