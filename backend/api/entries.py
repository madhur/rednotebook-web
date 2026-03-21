from fastapi import APIRouter, HTTPException, Request
from backend.schemas import DayEntry, MonthSummary, SaveResponse
import datetime

router = APIRouter()


def _get_service(request: Request):
    return request.app.state.journal


def _build_day_entry(year: int, month: int, day: int, day_content: dict) -> DayEntry:
    import re
    HASHTAG_RE = re.compile(r'(?<![&\w#])(#|\uff03)([^\W\d_]\w*)', re.IGNORECASE)
    text = day_content.get("text", "")
    hashtags = [m.group(2).lower() for m in HASHTAG_RE.finditer(text)]
    categories = {}
    for key, val in day_content.items():
        if key == "text":
            continue
        if val is None:
            categories[key] = []
        elif isinstance(val, dict):
            categories[key] = list(val.keys())
        else:
            categories[key] = []
    date_str = f"{year:04d}-{month:02d}-{day:02d}"
    return DayEntry(date=date_str, text=text, categories=categories, hashtags=hashtags)


@router.get("/entries/{year}/{month}/{day}", response_model=DayEntry)
async def get_entry(year: int, month: int, day: int, request: Request):
    try:
        datetime.date(year, month, day)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date")
    svc = _get_service(request)
    day_content = svc.get_entry(year, month, day)
    return _build_day_entry(year, month, day, day_content)


@router.put("/entries/{year}/{month}/{day}", response_model=SaveResponse)
async def save_entry(year: int, month: int, day: int, entry: DayEntry, request: Request):
    try:
        datetime.date(year, month, day)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date")
    svc = _get_service(request)
    success = svc.save_entry(year, month, day, entry.text, entry.categories)
    date_str = f"{year:04d}-{month:02d}-{day:02d}"
    return SaveResponse(success=success, date=date_str)


@router.delete("/entries/{year}/{month}/{day}")
async def delete_entry(year: int, month: int, day: int, request: Request):
    try:
        datetime.date(year, month, day)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date")
    svc = _get_service(request)
    svc.delete_entry(year, month, day)
    return {"success": True}


@router.get("/entries/{year}/{month}", response_model=MonthSummary)
async def get_month_summary(year: int, month: int, request: Request):
    svc = _get_service(request)
    days = svc.get_month_summary(year, month)
    return MonthSummary(year=year, month=month, days_with_entries=days)


@router.get("/months")
async def get_all_months(request: Request):
    svc = _get_service(request)
    return {"months": svc.get_all_months()}
