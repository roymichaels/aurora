from __future__ import annotations

import json
import logging
from logging.handlers import TimedRotatingFileHandler
from pathlib import Path


LOG_DIR = Path(__file__).resolve().parent.parent / "logs"
LOG_DIR.mkdir(exist_ok=True)
LOG_FILE = LOG_DIR / "app.log"


class JsonFormatter(logging.Formatter):
    """Format log records as JSON with request and agent metadata."""

    def format(self, record: logging.LogRecord) -> str:  # type: ignore[override]
        log_record = {
            "timestamp": self.formatTime(record, self.datefmt),
            "level": record.levelname,
            "message": record.getMessage(),
            "request_id": getattr(record, "request_id", None),
            "agent": getattr(record, "agent", None),
        }
        return json.dumps(log_record)


_handler = TimedRotatingFileHandler(LOG_FILE, when="midnight")
_handler.setFormatter(JsonFormatter())

logging.basicConfig(level=logging.INFO, handlers=[_handler])


def get_logger(name: str) -> logging.Logger:
    """Return a logger configured for JSON output and daily rotation."""

    return logging.getLogger(name)
