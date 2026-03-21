from fastapi import APIRouter, Request
from backend.schemas import TagCount

router = APIRouter()


@router.get("/tags", response_model=list[TagCount])
async def get_tags(request: Request):
    svc = request.app.state.journal
    raw = svc.get_all_tags()
    return [TagCount(**t) for t in raw]
