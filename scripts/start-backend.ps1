# Starts the Medic backend on http://127.0.0.1:8001.
# Passwords are read as hidden input and only kept in this process's environment.
#
# Usage (from the repository root):
#   powershell -ExecutionPolicy Bypass -File .\scripts\start-backend.ps1
#
# Optional overrides via environment variables before running:
#   ORTHANC_URL (default http://100.97.193.98:8042), ORTHANC_USERNAME (default orthanc)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

function Read-Secret([string]$prompt) {
    $secure = Read-Host $prompt -AsSecureString
    $plain = (New-Object System.Management.Automation.PSCredential("x", $secure)).GetNetworkCredential().Password
    return $plain
}

$dbPassword = [System.Uri]::EscapeDataString((Read-Secret "PostgreSQL password"))
$env:DATABASE_URL = "postgresql+psycopg://postgres:$dbPassword@localhost:5432/medic"
Remove-Variable dbPassword

if (-not $env:ORTHANC_URL) { $env:ORTHANC_URL = "http://100.97.193.98:8042" }
if (-not $env:ORTHANC_USERNAME) { $env:ORTHANC_USERNAME = "orthanc" }
$env:ORTHANC_PASSWORD = Read-Secret "Orthanc password"

$env:PYTHONPATH = "$root\backend;$root"

Write-Host "Starting Medic backend on http://127.0.0.1:8001 (Orthanc: $env:ORTHANC_URL)"
& "$root\backend\.venv\Scripts\python.exe" -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8001 --reload --reload-dir backend
