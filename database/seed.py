from datetime import date
from sqlalchemy import select

from database.session import SessionLocal
from database.models import Patient, Study


def seed_database():
    with SessionLocal() as session:
        try:
            # Seed patients using the IDs specified in the project document.
            patients_data = [
                {
                    "patient_id": "PT-00124",
                    "mrn": "987654",
                    "first_name": "John",
                    "last_name": "Doe",
                    "date_of_birth": date(1985, 5, 12),
                    "gender": "Male",
                },
                {
                    "patient_id": "PT-00125",
                    "mrn": "987655",
                    "first_name": "Emily",
                    "last_name": "Carter",
                    "date_of_birth": date(1990, 8, 20),
                    "gender": "Female",
                },
                {
                    "patient_id": "PT-00126",
                    "mrn": "987656",
                    "first_name": "Michael",
                    "last_name": "Wilson",
                    "date_of_birth": date(1978, 3, 15),
                    "gender": "Male",
                },
                {
                    "patient_id": "PT-00127",
                    "mrn": "987657",
                    "first_name": "Sophia",
                    "last_name": "Martinez",
                    "date_of_birth": date(1995, 11, 2),
                    "gender": "Female",
                },
                {
                    "patient_id": "PT-00128",
                    "mrn": "987658",
                    "first_name": "Daniel",
                    "last_name": "Brown",
                    "date_of_birth": date(1988, 1, 25),
                    "gender": "Male",
                },
            ]

            patients_by_id = {}

            for data in patients_data:
                patient = session.scalar(
                    select(Patient).where(
                        Patient.patient_id == data["patient_id"]
                    )
                )

                if patient is None:
                    patient = Patient(**data)
                    session.add(patient)
                    session.flush()
                else:
                    # Keep existing records intact; don't overwrite user data.
                    pass

                patients_by_id[data["patient_id"]] = patient

            # Seed the five studies listed in the project specification.
            studies_data = [
                {
                    "study_id": "ST-00192",
                    "patient_id": "PT-00124",
                    "study_description": "MRI Brain w/ Contrast",
                    "modality": "MR",
                },
                {
                    "study_id": "ST-00191",
                    "patient_id": "PT-00125",
                    "study_description": "CT Chest",
                    "modality": "CT",
                },
                {
                    "study_id": "ST-00190",
                    "patient_id": "PT-00126",
                    "study_description": "MRI Knee",
                    "modality": "MR",
                },
                {
                    "study_id": "ST-00189",
                    "patient_id": "PT-00127",
                    "study_description": "CT Head",
                    "modality": "CT",
                },
                {
                    "study_id": "ST-00188",
                    "patient_id": "PT-00128",
                    "study_description": "X-Ray Chest",
                    "modality": "CR",
                },
            ]

            for data in studies_data:
                study = session.scalar(
                    select(Study).where(
                        Study.study_id == data["study_id"]
                    )
                )

                if study is None:
                    patient = patients_by_id[data["patient_id"]]

                    session.add(
                        Study(
                            study_id=data["study_id"],
                            patient_id=patient.id,
                            study_description=data["study_description"],
                            modality=data["modality"],
                            status="READY",
                        )
                    )

            session.commit()

            print("Seed data loaded successfully.")
            print(f"Patients checked: {len(patients_data)}")
            print(f"Studies checked: {len(studies_data)}")

        except Exception:
            session.rollback()
            raise


if __name__ == "__main__":
    seed_database()