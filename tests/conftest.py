import os
import sys
from pathlib import Path

# The app imports itself as `app.*` (uvicorn runs with --app-dir backend).
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))

# database.session requires a URL at import time; tests never connect.
os.environ.setdefault("DATABASE_URL", "postgresql+psycopg://test@127.0.0.1:1/test")
