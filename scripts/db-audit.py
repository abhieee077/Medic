"""Read-only audit of the Medic PostgreSQL database.

Runs inside a READ ONLY transaction, so it cannot change any data.

Usage (from the repository root):
    backend\\.venv\\Scripts\\python.exe scripts\\db-audit.py

Uses DATABASE_URL if set; otherwise asks for the postgres password (hidden)
and connects to localhost:5432/medic.
"""

import getpass
import os
import sys
from urllib.parse import quote

from sqlalchemy import create_engine, text


def database_url() -> str:
    url = os.getenv("DATABASE_URL")
    if url:
        return url
    password = getpass.getpass("PostgreSQL password (hidden): ")
    return f"postgresql+psycopg://postgres:{quote(password, safe='')}@localhost:5432/medic"


CHECKS = {
    "PostgreSQL version": "SELECT version()",
    "Alembic revision": "SELECT version_num FROM alembic_version",
    "Tables": """
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public' ORDER BY table_name""",
    "Row counts": """
        SELECT 'patients', count(*) FROM patients UNION ALL
        SELECT 'studies', count(*) FROM studies UNION ALL
        SELECT 'series', count(*) FROM series UNION ALL
        SELECT 'dicom_instances', count(*) FROM dicom_instances UNION ALL
        SELECT 'reports', count(*) FROM reports UNION ALL
        SELECT 'ai_analyses', count(*) FROM ai_analyses UNION ALL
        SELECT 'ai_findings', count(*) FROM ai_findings UNION ALL
        SELECT 'conversations', count(*) FROM conversations UNION ALL
        SELECT 'messages', count(*) FROM messages UNION ALL
        SELECT 'users', count(*) FROM users""",
    "Foreign keys": """
        SELECT tc.table_name || '.' || kcu.column_name || ' -> ' || ccu.table_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' ORDER BY 1""",
    "Unique constraints": """
        SELECT tc.table_name || '.' || kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'UNIQUE' ORDER BY 1""",
    "Studies with more than one DRAFT report (should be none)": """
        SELECT s.study_id, count(*) FROM reports r JOIN studies s ON s.id = r.study_id
        WHERE r.status = 'DRAFT' GROUP BY s.study_id HAVING count(*) > 1""",
    "Duplicate patient MRNs (should be none)": """
        SELECT mrn, count(*) FROM patients GROUP BY mrn HAVING count(*) > 1""",
    "Finalized reports missing finalized_at (should be none)": """
        SELECT report_id FROM reports WHERE status = 'FINALIZED' AND finalized_at IS NULL""",
    "AI analyses stuck RUNNING (should be none)": """
        SELECT id, created_at FROM ai_analyses WHERE status = 'RUNNING'""",
    "Demo author user exists": """
        SELECT count(*) FROM users WHERE id = 'c84708d4-370d-4f75-bb5f-b3d4c06e237d'""",
}


def main() -> int:
    engine = create_engine(database_url())
    failed = False
    with engine.connect() as connection:
        connection.execute(text("SET TRANSACTION READ ONLY"))
        for title, sql in CHECKS.items():
            print(f"\n== {title}")
            try:
                rows = connection.execute(text(sql)).all()
            except Exception as error:  # report and continue with the other checks
                failed = True
                print(f"  ERROR: {error.__class__.__name__}: {str(error).splitlines()[0]}")
                connection.rollback()
                connection.execute(text("SET TRANSACTION READ ONLY"))
                continue
            if not rows:
                print("  (none)")
            for row in rows:
                print("  " + " | ".join(str(value) for value in row))
        connection.rollback()
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
