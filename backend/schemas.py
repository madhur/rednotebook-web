from pydantic import BaseModel
from typing import Optional

class DayEntry(BaseModel):
    date: str  # YYYY-MM-DD
    text: str = ""
    categories: dict[str, list[str]] = {}  # name -> list of entries
    hashtags: list[str] = []

class MonthSummary(BaseModel):
    year: int
    month: int
    days_with_entries: list[int]  # day numbers that have entries

class SearchResult(BaseModel):
    date: str  # YYYY-MM-DD
    snippet: str
    tags: list[str]

class TagCount(BaseModel):
    tag: str
    count: int

class RenderRequest(BaseModel):
    text: str

class RenderResponse(BaseModel):
    html: str

class SaveResponse(BaseModel):
    success: bool
    date: str
