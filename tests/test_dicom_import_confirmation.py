
from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError

from backend.app.services.dicom_sync import confirm_study_import


def test_confirmation_rejects_unknown_patient():
    db = MagicMock()
    db.scalar.return_value = None

    with patch(
        "backend.app.services.dicom_sync.orthanc_json"
    ) as orthanc_mock:
        with pytest.raises(HTTPException) as error:
            confirm_study_import(
                db=db,
                orthanc_study_id="mock-orthanc-study",
                patient_public_id="PT-DOES-NOT-EXIST",
            )

    assert error.value.status_code == 404
    assert error.value.detail == "Patient not found."

    orthanc_mock.assert_not_called()
    db.add.assert_not_called()
    db.commit.assert_not_called()


def test_confirmation_rejects_already_imported_study():
    db = MagicMock()

    patient = MagicMock()
    patient.id = "mock-patient-uuid"

    # Patient exists; the study UID is already present.
    db.scalar.side_effect = [patient, "existing-study-uuid"]

    study_metadata = {
        "MainDicomTags": {
            "StudyInstanceUID": "1.2.840.mock.study",
        },
        "Series": ["mock-series-id"],
    }

    with patch(
        "backend.app.services.dicom_sync.orthanc_json",
        return_value=study_metadata,
    ):
        with pytest.raises(HTTPException) as error:
            confirm_study_import(
                db=db,
                orthanc_study_id="mock-orthanc-study",
                patient_public_id="PT-00124",
            )

    assert error.value.status_code == 409
    assert error.value.detail == "This study is already imported."

    db.add.assert_not_called()
    db.commit.assert_not_called()


def test_confirmation_rolls_back_on_database_integrity_error():
    db = MagicMock()

    patient = MagicMock()
    patient.id = "mock-patient-uuid"
    patient.patient_id = "PT-00124"

    # Patient, study UID, series UID, SOP UID, and generated study ID checks.
    db.scalar.side_effect = [
        patient,
        None,
        None,
        None,
        None,
    ]

    study_metadata = {
        "MainDicomTags": {
            "StudyInstanceUID": "1.2.840.mock.study.rollback",
            "StudyDate": "20261011",
            "StudyTime": "101010",
            "StudyDescription": "Mock CT study",
            "AccessionNumber": "MOCK-001",
        },
        "PatientMainDicomTags": {},
        "Series": ["mock-series-id"],
    }

    series_metadata = {
        "MainDicomTags": {
            "SeriesInstanceUID": "1.2.840.mock.series.rollback",
            "SeriesNumber": "1",
            "Modality": "CT",
            "SeriesDescription": "Mock series",
        },
        "Instances": ["mock-instance-id"],
    }

    instance_metadata = {
        "MainDicomTags": {
            "SOPInstanceUID": "1.2.840.mock.instance.rollback",
            "InstanceNumber": "1",
            "SOPClassUID": "1.2.840.mock.sop-class",
        },
        "FileSize": 100,
    }

    def mocked_orthanc_json(path):
        responses = {
            "studies/mock-orthanc-study": study_metadata,
            "series/mock-series-id": series_metadata,
            "instances/mock-instance-id": instance_metadata,
        }

        if path not in responses:
            raise AssertionError(f"Unexpected Orthanc request: {path}")

        return responses[path]

    # Simulate a database constraint failure during the first flush.
    db.flush.side_effect = IntegrityError(
        "mock insert conflict",
        {},
        Exception("simulated database constraint violation"),
    )

    with patch(
        "backend.app.services.dicom_sync.orthanc_json",
        side_effect=mocked_orthanc_json,
    ):
        with patch(
            "backend.app.services.dicom_sync.secrets.token_hex",
            return_value="ABCDEF123456",
        ):
            with pytest.raises(HTTPException) as error:
                confirm_study_import(
                    db=db,
                    orthanc_study_id="mock-orthanc-study",
                    patient_public_id="PT-00124",
                )

    assert error.value.status_code == 409
    assert error.value.detail == (
        "A duplicate identifier or database constraint prevented import."
    )

    db.rollback.assert_called_once()
    db.commit.assert_not_called()
