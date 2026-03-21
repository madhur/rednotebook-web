import codecs
import datetime
import logging
import os
import re
import shutil
import stat
import threading
from collections import defaultdict
from typing import Optional

import yaml

try:
    from yaml import CLoader as Loader, CSafeDumper as Dumper
except ImportError:
    from yaml import Loader, Dumper

logger = logging.getLogger(__name__)

HASHTAG_RE = re.compile(
    r'(?<![&\w#])(#|\uff03)([^\W\d_]\w*)',
    re.IGNORECASE
)
DATE_FILE_RE = re.compile(r'^(\d{4})-(\d{2})\.txt$')


def _format_ym(year: int, month: int) -> str:
    return f"{year:04d}-{month:02d}"


class JournalService:
    """Thread-safe service for reading/writing RedNotebook YAML data files."""

    def __init__(self, data_dir: str):
        self.data_dir = os.path.expanduser(data_dir)
        self._months: dict[str, dict] = {}  # "YYYY-MM" -> {day_num: day_content}
        self._mtimes: dict[str, float] = {}  # "YYYY-MM" -> file mtime
        self._lock = threading.RLock()

    def load(self):
        """Load all month files from disk into memory cache."""
        os.makedirs(self.data_dir, exist_ok=True)
        with self._lock:
            self._months.clear()
            self._mtimes.clear()
            for fname in sorted(os.listdir(self.data_dir)):
                m = DATE_FILE_RE.match(fname)
                if not m:
                    continue
                year, month = int(m.group(1)), int(m.group(2))
                key = _format_ym(year, month)
                path = os.path.join(self.data_dir, fname)
                data = self._load_file(path)
                if data is not None:
                    self._months[key] = data or {}
                    self._mtimes[key] = os.path.getmtime(path)

    def _load_file(self, path: str) -> Optional[dict]:
        try:
            with codecs.open(path, 'rb', encoding='utf-8') as f:
                return yaml.load(f, Loader=Loader) or {}
        except Exception as e:
            logger.error(f"Failed to load {path}: {e}")
            return None

    def _ensure_month(self, year: int, month: int):
        key = _format_ym(year, month)
        if key not in self._months:
            self._months[key] = {}
            # Try to load from disk in case it was created externally
            path = self._month_path(year, month)
            if os.path.exists(path):
                data = self._load_file(path)
                if data is not None:
                    self._months[key] = data
                    self._mtimes[key] = os.path.getmtime(path)

    def _month_path(self, year: int, month: int, infix: str = '') -> str:
        return os.path.join(self.data_dir, f"{_format_ym(year, month)}{infix}.txt")

    def get_entry(self, year: int, month: int, day: int) -> dict:
        """Return day content dict, creating empty one if needed."""
        with self._lock:
            self._ensure_month(year, month)
            key = _format_ym(year, month)
            month_data = self._months[key]
            day_content = month_data.get(day, {"text": ""})
            if "text" not in day_content:
                day_content["text"] = ""
            return dict(day_content)

    def save_entry(self, year: int, month: int, day: int, text: str, categories: dict) -> bool:
        """Save a day entry. categories is {name: [entry1, entry2, ...]}."""
        with self._lock:
            self._ensure_month(year, month)
            key = _format_ym(year, month)

            # Build day content
            day_content: dict = {"text": text}
            for cat_name, entries in categories.items():
                if entries:
                    day_content[cat_name] = {e: None for e in entries}
                else:
                    day_content[cat_name] = None

            # Store in memory
            if text.strip() or len(day_content) > 1:
                self._months[key][day] = day_content
            else:
                # Empty entry - remove from month
                self._months[key].pop(day, None)

            return self._save_month(year, month)

    def delete_entry(self, year: int, month: int, day: int) -> bool:
        with self._lock:
            key = _format_ym(year, month)
            if key in self._months:
                self._months[key].pop(day, None)
                return self._save_month(year, month)
            return False

    def _save_month(self, year: int, month: int) -> bool:
        """Write month YAML to disk atomically."""
        key = _format_ym(year, month)
        month_data = self._months.get(key, {})

        # Filter empty days
        content = {
            day_num: day_content
            for day_num, day_content in month_data.items()
            if day_content.get("text", "").strip() or len(day_content) > 1
        }

        filename = self._month_path(year, month)
        new_path = self._month_path(year, month, ".new")
        old_path = self._month_path(year, month, ".old")

        if not content and not os.path.exists(filename):
            return False

        os.makedirs(self.data_dir, exist_ok=True)

        try:
            with codecs.open(new_path, 'wb', encoding='utf-8') as f:
                yaml.dump(content, f, Dumper=Dumper, allow_unicode=True)

            # Atomic replace
            if os.path.exists(filename):
                shutil.copy2(filename, old_path)
            if os.path.exists(filename):
                os.remove(filename)
            shutil.move(new_path, filename)
            if os.path.exists(old_path):
                os.remove(old_path)

            try:
                os.chmod(filename, stat.S_IRUSR | stat.S_IWUSR)
            except OSError:
                pass

            self._mtimes[key] = os.path.getmtime(filename)
            logger.info(f"Saved {filename}")
            return True
        except Exception as e:
            logger.error(f"Failed to save {filename}: {e}")
            return False

    def get_month_summary(self, year: int, month: int) -> list[int]:
        """Return list of day numbers that have entries."""
        with self._lock:
            self._ensure_month(year, month)
            key = _format_ym(year, month)
            month_data = self._months.get(key, {})
            result = []
            for day_num, day_content in month_data.items():
                if day_content.get("text", "").strip() or len(day_content) > 1:
                    result.append(day_num)
            return sorted(result)

    def get_all_months(self) -> list[str]:
        """Return sorted list of 'YYYY-MM' keys that have data."""
        with self._lock:
            return sorted(self._months.keys())

    def search(self, query: str = "", tag: str = "") -> list[dict]:
        """Search across all entries. Returns list of {date, snippet, tags}."""
        results = []
        query_lower = query.lower() if query else ""
        tag_lower = tag.lower() if tag else ""

        with self._lock:
            for ym_key, month_data in sorted(self._months.items()):
                year_str, month_str = ym_key.split('-')
                year, month = int(year_str), int(month_str)
                for day_num, day_content in sorted(month_data.items()):
                    text = day_content.get("text", "")
                    if not text.strip():
                        continue

                    date_str = f"{year:04d}-{month:02d}-{day_num:02d}"

                    # Extract hashtags from text
                    hashtags = [m.group(2).lower() for m in HASHTAG_RE.finditer(text)]

                    # Tag filter
                    if tag_lower:
                        # Check in hashtags and category names
                        cat_names = [k.lower() for k in day_content if k != "text"]
                        if tag_lower not in hashtags and tag_lower not in cat_names:
                            continue

                    # Text search
                    if query_lower:
                        idx = text.lower().find(query_lower)
                        if idx < 0:
                            continue
                        start = max(0, idx - 30)
                        end = min(len(text), idx + len(query) + 30)
                        snippet = ("..." if start > 0 else "") + text[start:end].replace('\n', ' ') + ("..." if end < len(text) else "")
                    else:
                        snippet = text[:80].replace('\n', ' ') + ("..." if len(text) > 80 else "")

                    results.append({
                        "date": date_str,
                        "snippet": snippet,
                        "tags": hashtags[:5],
                    })

        return results

    def get_all_tags(self) -> list[dict]:
        """Return all unique hashtags with counts across all entries."""
        tag_counts: dict[str, int] = defaultdict(int)
        with self._lock:
            for month_data in self._months.values():
                for day_content in month_data.values():
                    text = day_content.get("text", "")
                    for m in HASHTAG_RE.finditer(text):
                        tag_counts[m.group(2).lower()] += 1
                    # Also count explicit category tags
                    for key in day_content:
                        if key != "text":
                            tag_counts[key.lower()] += 1

        return [
            {"tag": tag, "count": count}
            for tag, count in sorted(tag_counts.items(), key=lambda x: -x[1])
        ]
