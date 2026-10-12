
from unittest.mock import MagicMock, patch

from backend.app.services.dicom_sync import preview_study_sync


def test_preview_matches_study_by_exact_uid():
    db = MagicMock()

    existing_study = MagicMock()
    existing_study.study_instance_uid = "1.2.3.4"
    existing_study.study_id = "ST-00188"
    db.scalars.return_value.all.return_value = [existing_study]

    orthanc_studies = [{
        "orthanc_study_id": "orthanc-1",
        "study_instance_uid": "1.2.3.4",
        "study_description": "CT Chest",
        "modalities": ["CT"],
        "series_count": 1,
        "instance_count": 10,
    }]

    with patch(
        "backend.app.services.dicom_sync.fetch_orthanc_studies",
        return_value=orthanc_studies,
    ):
        result = preview_study_sync(db)

    assert result["matched_count"] == 1
    assert result["unmatched_count"] == 0
    assert result["matched"][0]["application_study_id"] == "ST-00188"
    assert result["database_writes"] is False
    db.add.assert_not_called()
    db.commit.assert_not_called()


def test_preview_reports_unmatched_study_without_linking_it():
    db = MagicMock()
    db.scalars.return_value.all.return_value = []

    orthanc_studies = [{
        "orthanc_study_id": "orthanc-2",
        "study_instance_uid": "9.8.7.6",
        "study_description": "US Kidney",
        "modalities": ["US"],
        "series_count": 1,
        "instance_count": 43,
    }]

    with patch(
        "backend.app.services.dicom_sync.fetch_orthanc_studies",
        return_value=orthanc_studies,
    ):
        result = preview_study_sync(db)

    assert result["matched_count"] == 0
    assert result["unmatched_count"] == 1
    assert result["unmatched"][0]["study_instance_uid"] == "9.8.7.6"
    assert "application_study_id" not in result["unmatched"][0]
    assert result["database_writes"] is False
    db.add.assert_not_called()
    db.commit.assert_not_called()


def test_preview_does_not_match_missing_uid():
    db = MagicMock()

    existing_study = MagicMock()
    existing_study.study_instance_uid = None
    existing_study.study_id = "ST-00189"
    db.scalars.return_value.all.return_value = [existing_study]

    orthanc_studies = [{
        "orthanc_study_id": "orthanc-3",
        "study_instance_uid": None,
        "study_description": "CT Head",
        "modalities": ["CT"],
        "series_count": 1,
        "instance_count": 5,
    }]

    with patch(
        "backend.app.services.dicom_sync.fetch_orthanc_studies",
        return_value=orthanc_studies,
    ):
        result = preview_study_sync(db)

    assert result["matched_count"] == 0
    assert result["unmatched_count"] == 1
    db.add.assert_not_called()
    db.commit.assert_not_called()
