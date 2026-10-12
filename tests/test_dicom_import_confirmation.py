
from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError

from backend.app.services.dicom_sync import confirm_study_import


def make_mock_study_data(
    study_uid="1.2.840.mock.study",
    series_uid="1.2.840.mock.series",
    sop_uid="1.2.840.mock.instance",
):
    """Create fake Orthanc metadata for one study, series, and instance."""
    study_metadata = {
        "MainDicomTags": {
            "StudyInstanceUID": study_uid,
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
            "SeriesInstanceUID": series_uid,
            "SeriesNumber": "1",
            "Modality": "CT",
            "SeriesDescription": "Mock series",
        },
        "Instances": ["mock-instance-id"],
    }

    instance_metadata = {
        "MainDicomTags": {
            "SOPInstanceUID": sop_uid,
            "InstanceNumber": "1",
            "SOPClassUID": "1.2.840.mock.sop-class",
        },
        "FileSize": 100,
    }

    return {
        "studies/mock-orthanc-study": study_metadata,
        "series/mock-series-id": series_metadata,
        "instances/mock-instance-id": instance_metadata,
    }


def mock_orthanc_responses(responses):
    def get_metadata(path):
        if path not in responses:
            raise AssertionError(f"Unexpected Orthanc request: {path}")
        return responses[path]

    return get_metadata


def make_existing_patient():
    patient = MagicMock()
    patient.id = "mock-patient-uuid"
    patient.patient_id = "PT-00124"
    return patient


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
    db.scalar.side_effect = [
        make_existing_patient(),
        "existing-study-uuid",
    ]

    responses = make_mock_study_data()

    with patch(
        "backend.app.services.dicom_sync.orthanc_json",
        side_effect=mock_orthanc_responses(responses),
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
    db.scalar.side_effect = [
        make_existing_patient(),
        None,  # Study UID not found
        None,  # Series UID not found
        None,  # SOP UID not found
        None,  # Generated study ID available
    ]
    db.flush.side_effect = IntegrityError(
        "mock insert conflict",
        {},
        Exception("simulated database constraint violation"),
    )

    responses = make_mock_study_data()

    with patch(
        "backend.app.services.dicom_sync.orthanc_json",
        side_effect=mock_orthanc_responses(responses),
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


def test_confirmation_rejects_existing_series_uid():
    db = MagicMock()
    db.scalar.side_effect = [
        make_existing_patient(),
        None,                    # Study UID not found
        "existing-series-uuid",  # Series UID already exists
    ]

    responses = make_mock_study_data()

    with patch(
        "backend.app.services.dicom_sync.orthanc_json",
        side_effect=mock_orthanc_responses(responses),
    ):
        with pytest.raises(HTTPException) as error:
            confirm_study_import(
                db=db,
                orthanc_study_id="mock-orthanc-study",
                patient_public_id="PT-00124",
            )

    assert error.value.status_code == 409
    assert error.value.detail == "A series UID is already imported."
    db.add.assert_not_called()
    db.commit.assert_not_called()


def test_confirmation_rejects_existing_instance_uid():
    db = MagicMock()
    db.scalar.side_effect = [
        make_existing_patient(),
        None,  # Study UID not found
        None,  # Series UID not found
        "existing-instance-uuid",  # SOP UID already exists
    ]

    responses = make_mock_study_data()

    with patch(
        "backend.app.services.dicom_sync.orthanc_json",
        side_effect=mock_orthanc_responses(responses),
    ):
        with pytest.raises(HTTPException) as error:
            confirm_study_import(
                db=db,
                orthanc_study_id="mock-orthanc-study",
                patient_public_id="PT-00124",
            )

    assert error.value.status_code == 409
    assert error.value.detail == "An instance UID is already imported."
    db.add.assert_not_called()
    db.commit.assert_not_called()


def test_confirmation_rejects_duplicate_series_uids_within_study():
    db = MagicMock()
    db.scalar.side_effect = [
        make_existing_patient(),
        None,  # Study UID not found
    ]

    responses = make_mock_study_data()
    responses["studies/mock-orthanc-study"]["Series"] = [
        "mock-series-id",
        "second-series-id",
    ]

    responses["series/second-series-id"] = {
        "MainDicomTags": {
            # Deliberately duplicate the first series UID.
            "SeriesInstanceUID": "1.2.840.mock.series",
            "SeriesNumber": "2",
            "Modality": "CT",
        },
        "Instances": ["second-instance-id"],
    }

    responses["instances/second-instance-id"] = {
        "MainDicomTags": {
            "SOPInstanceUID": "1.2.840.mock.instance.second",
            "InstanceNumber": "2",
            "SOPClassUID": "1.2.840.mock.sop-class",
        },
        "FileSize": 100,
    }

    with patch(
        "backend.app.services.dicom_sync.orthanc_json",
        side_effect=mock_orthanc_responses(responses),
    ):
        with pytest.raises(HTTPException) as error:
            confirm_study_import(
                db=db,
                orthanc_study_id="mock-orthanc-study",
                patient_public_id="PT-00124",
            )

    assert error.value.status_code == 422
    assert error.value.detail == "Duplicate SeriesInstanceUID in study."
    db.add.assert_not_called()
    db.commit.assert_not_called()


def test_confirmation_rejects_duplicate_instance_uids_within_study():
    db = MagicMock()
    db.scalar.side_effect = [
        make_existing_patient(),
        None,  # Study UID not found
    ]

    responses = make_mock_study_data()
    responses["studies/mock-orthanc-study"]["Series"] = [
        "mock-series-id",
        "second-series-id",
    ]

    # Two distinct series deliberately contain the same SOP Instance UID.
    responses["series/second-series-id"] = {
        "MainDicomTags": {
            "SeriesInstanceUID": "1.2.840.mock.series.second",
            "SeriesNumber": "2",
            "Modality": "CT",
        },
        "Instances": ["second-instance-id"],
    }

    responses["instances/second-instance-id"] = {
        "MainDicomTags": {
            "SOPInstanceUID": "1.2.840.mock.instance",
            "InstanceNumber": "2",
            "SOPClassUID": "1.2.840.mock.sop-class",
        },
        "FileSize": 100,
    }

    with patch(
        "backend.app.services.dicom_sync.orthanc_json",
        side_effect=mock_orthanc_responses(responses),
    ):
        with pytest.raises(HTTPException) as error:
            confirm_study_import(
                db=db,
                orthanc_study_id="mock-orthanc-study",
                patient_public_id="PT-00124",
            )

    assert error.value.status_code == 422
    assert error.value.detail == "Duplicate SOPInstanceUID in study."
    db.add.assert_not_called()
    db.commit.assert_not_called()
