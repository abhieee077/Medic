from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest
from fastapi import HTTPException

from app.api.v1 import reports
from app.api.v1.reports import (
    FinalizeReportRequest,
    SaveDraftRequest,
    finalize_report,
    get_report,
    reopen_report,
    save_draft,
)


def make_report(status="DRAFT"):
    return SimpleNamespace(
        id="report-uuid",
        report_id="R-TEST",
        study_id="study-uuid",
        status=status,
        findings="old findings",
        impression="old impression",
        finalized_at=None,
        created_at=None,
        updated_at=None,
    )


def db_returning(*results):
    """A mock session whose successive execute() calls return the given rows."""
    db = MagicMock()
    calls = []
    for result in results:
        call = MagicMock()
        call.scalar_one_or_none.return_value = result
        call.scalars.return_value.first.return_value = result
        call.first.return_value = result
        calls.append(call)
    db.execute.side_effect = calls
    return db


def test_finalize_unknown_report_is_404():
    with pytest.raises(HTTPException) as error:
        finalize_report("R-NOPE", FinalizeReportRequest(), db_returning(None))
    assert error.value.status_code == 404


def test_finalize_twice_is_409():
    with pytest.raises(HTTPException) as error:
        finalize_report("R-TEST", FinalizeReportRequest(), db_returning(make_report("FINALIZED")))
    assert error.value.status_code == 409


def test_finalize_saves_latest_text_and_sets_status():
    report = make_report()
    db = db_returning(report)

    result = finalize_report(
        "R-TEST",
        FinalizeReportRequest(findings="new findings", impression="new impression"),
        db,
    )

    assert report.status == "FINALIZED"
    assert report.finalized_at is not None
    assert result["findings"] == "new findings"
    assert result["impression"] == "new impression"
    db.commit.assert_called_once()


def test_reopen_draft_is_409():
    with pytest.raises(HTTPException) as error:
        reopen_report("R-TEST", db_returning(make_report("DRAFT")))
    assert error.value.status_code == 409


def test_reopen_finalized_returns_to_draft():
    report = make_report("FINALIZED")
    # Second query: no other open draft for the study.
    db = db_returning(report, None)
    db.get.return_value = SimpleNamespace(study_id="ST-1")

    result = reopen_report("R-TEST", db)

    assert report.status == "DRAFT"
    assert report.finalized_at is None
    assert result["status"] == "DRAFT"
    assert result["study_id"] == "ST-1"


def test_reopen_refused_when_study_has_another_draft():
    report = make_report("FINALIZED")

    with pytest.raises(HTTPException) as error:
        reopen_report("R-TEST", db_returning(report, "R-OTHER"))

    assert error.value.status_code == 409
    assert "R-OTHER" in error.value.detail
    assert report.status == "FINALIZED"


def test_save_draft_unknown_study_is_404():
    with pytest.raises(HTTPException) as error:
        save_draft(SaveDraftRequest(study_id="ST-NOPE"), db_returning(None))
    assert error.value.status_code == 404


def test_save_draft_updates_existing_draft_instead_of_duplicating():
    study = SimpleNamespace(id="study-uuid", study_id="ST-1")
    report = make_report()
    db = db_returning(study, report)

    save_draft(SaveDraftRequest(study_id="ST-1", findings="f", impression="i"), db)

    db.add.assert_not_called()
    assert (report.findings, report.impression) == ("f", "i")


def test_save_draft_creates_draft_when_none_exists():
    study = SimpleNamespace(id="study-uuid", study_id="ST-1")
    db = db_returning(study, None)

    save_draft(SaveDraftRequest(study_id="ST-1", findings="f"), db)

    created = db.add.call_args.args[0]
    assert created.status == "DRAFT"
    assert created.author_id == reports.DEMO_AUTHOR_ID
    assert created.report_id.startswith("R-")


def test_get_unknown_report_is_404():
    with pytest.raises(HTTPException) as error:
        get_report("R-NOPE", db_returning(None))
    assert error.value.status_code == 404
