// OHIF runs as its own app on the teammate's machine (dicom/ohif-compose.yml on
// the imaging branch). scripts/ohif-relay.py serves it on localhost:3000 because
// browsers on this PC can't reach the Tailscale address directly.
// Images come from the backend's /dicom-web proxy (configured in OHIF itself).
export const OHIF_URL = (import.meta.env.VITE_OHIF_URL ?? "http://localhost:3000").replace(
  /\/$/,
  "",
);

export function ohifViewerUrl(studyInstanceUid: string) {
  return `${OHIF_URL}/viewer?StudyInstanceUIDs=${encodeURIComponent(studyInstanceUid)}`;
}
