# MEDIC Database Documentation

## 1. Overview

MEDIC is a medical imaging workspace. Its database stores application users, patient information, imaging studies, DICOM metadata, radiology reports, annotations, notifications, activity logs, and AI-related data.

**Database technology**
- PostgreSQL
- SQLAlchemy 2.x
- Alembic for database migrations
- Python

PostgreSQL stores DICOM metadata and identifiers. DICOM objects themselves are managed through Orthanc rather than storing the image binaries directly in PostgreSQL.

## 2. Database Tables

The database contains 14 application tables.

| Table | Purpose |
|---|---|
| `users` | Stores application user accounts and roles. |
| `patients` | Stores patient identifiers and demographic information. |
| `studies` | Stores imaging examination details and patient associations. |
| `series` | Stores groups of related images belonging to a study. |
| `dicom_instances` | Stores individual DICOM object metadata and Orthanc identifiers. |
| `reports` | Stores radiology reports, findings, impressions, and report status. |
| `measurements` | Stores image measurements and associated geometry. |
| `annotations` | Stores image annotations and flexible annotation data. |
| `notifications` | Stores notifications associated with users. |
| `activity_logs` | Stores user activity and timeline events. |
| `ai_analyses` | Stores AI execution history and status. |
| `ai_findings` | Stores structured findings produced by AI analyses. |
| `conversations` | Stores AI assistant conversations and optional study associations. |
| `messages` | Stores messages belonging to conversations. |

Alembic also maintains an `alembic_version` table to track the current migration revision. This is a migration-management table, not one of the 14 application tables.

## 3. Primary Keys and Identifiers

Each application table uses a UUID primary key.

Application-facing identifiers are stored separately from UUID primary keys. Examples include:
- Patient ID: `PT-00124`
- Study ID: `ST-00192`
- Report ID: values such as `RP-00124`

Other identifiers have distinct purposes:
- MRN identifies a patient within the institution's data context.
- DICOM UIDs identify DICOM studies, series, and instances.
- Orthanc identifiers connect stored metadata to objects managed by Orthanc.

These identifiers should not be treated as interchangeable.

## 4. Entity Relationships

### Imaging hierarchy

The principal imaging relationship is:

`patients` → `studies` → `series` → `dicom_instances`

- One patient can have multiple studies.
- One study can contain multiple series.
- One series can contain multiple DICOM instances.

### Other relationships

- `studies` → `reports`: a study can have multiple reports.
- `users` → `reports`: a user can author multiple reports.
- `studies` → `measurements`: measurements belong to a study.
- `studies` → `annotations`: annotations belong to a study.
- `studies` → `ai_analyses`: a study can have multiple AI analyses.
- `ai_analyses` → `ai_findings`: an analysis can produce multiple findings.
- `users` → `notifications`: notifications belong to users.
- `users` → `activity_logs`: activity records can reference users.
- `users` → `conversations`: users can have multiple conversations.
- `studies` → `conversations`: a conversation may optionally reference a study.
- `conversations` → `messages`: a conversation can contain multiple messages.

Foreign keys enforce the relationships defined in the SQLAlchemy models.

## 5. AI Data Storage

The AI-related tables are:
- `ai_analyses`
- `ai_findings`
- `conversations`
- `messages`

AI analysis records store provider, model name, analysis type, execution status, timestamps, and error information.

AI findings store structured results, including confidence, severity, body region, and optional location data.

Conversations and messages support the AI assistant workflow. AI-generated findings remain separate from physician-authored report content.

## 6. Flexible Data

PostgreSQL `JSONB` is used for flexible data such as:
- Measurement coordinates
- Annotation data
- Activity-log metadata
- AI finding location data

This allows the application to store structured information whose exact format may depend on the viewer or AI integration.

## 7. Database Configuration

The application reads its database connection string from the `DATABASE_URL` environment variable.

Example format:

`postgresql+psycopg://USERNAME:PASSWORD@HOST:5432/DATABASE_NAME`

Use your own local PostgreSQL credentials. Do not commit database passwords, API keys, or other secrets to Git.

## 8. Database Migrations

Alembic manages schema changes.

Apply existing migrations:

```powershell
python -m alembic upgrade head
```

Check the current migration:

```powershell
python -m alembic current
```

Create a migration after an approved model change:

```powershell
python -m alembic revision --autogenerate -m "describe schema change"
```

Review generated migration files before applying them. Schema changes should be represented by migrations rather than undocumented manual database changes.

## 9. Development Seed Data

The development seed script is located at:

`database/seed.py`

Run it with:

```powershell
python -m database.seed
```

The initial seed script checks for the specified patient and study application IDs before inserting missing records. It should be run against the intended development database.

The initial patient and study IDs and the listed study descriptions and modalities are based on the project specification. Some additional demographic values are illustrative and must be checked against the actual frontend data before being treated as final.

## 10. Verification

A fresh-database migration test was completed successfully.

The initial seed script was executed twice against the test database. Verification showed:
- 5 patient records
- 5 study records
- The expected five patient application IDs
- The expected five study application IDs

These checks validate the initial migration and seed-data workflow; they do not replace full application integration testing.

## 11. Scope and Responsibilities

The database layer provides the persistent data model for the MEDIC backend.

Its responsibilities include:
- PostgreSQL schema and relationships
- SQLAlchemy models
- Primary keys, foreign keys, and indexes
- Alembic migrations
- Development seed data
- Database documentation
- Persistence for AI analyses, findings, conversations, and messages

FastAPI endpoint implementation, frontend state management, Orthanc integration, and AI-provider orchestration are separate application responsibilities.
