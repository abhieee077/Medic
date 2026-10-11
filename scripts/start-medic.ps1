# Starts everything Medic needs:
#   - OHIF relay  http://localhost:3000  (background, logs\ohif-relay.log)
#   - frontend    http://localhost:5173  (background, logs\frontend.log)
#   - backend     http://127.0.0.1:8001  (this window)
# Secrets are read as hidden input and only kept in this process's environment.
#
# Usage (from the repository root):
#   powershell -ExecutionPolicy Bypass -File .\scripts\start-medic.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

function Read-Secret([string]$prompt) {
    $secure = Read-Host $prompt -AsSecureString
    return (New-Object System.Management.Automation.PSCredential("x", $secure)).GetNetworkCredential().Password
}

function Test-Port([int]$port) {
    return [bool](Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue)
}

$logs = Join-Path $root "logs"
New-Item -ItemType Directory -Force $logs | Out-Null
$python = Join-Path $root "backend\.venv\Scripts\python.exe"

# OHIF relay
if (Test-Port 3000) {
    Write-Host "OHIF relay: port 3000 already in use, assuming it is running."
} else {
    Start-Process -WindowStyle Hidden -FilePath $python -ArgumentList "scripts\ohif-relay.py" `
        -WorkingDirectory $root `
        -RedirectStandardOutput (Join-Path $logs "ohif-relay.log") `
        -RedirectStandardError (Join-Path $logs "ohif-relay.err.log")
    Write-Host "OHIF relay started on http://localhost:3000"
}

# Frontend
if (Test-Port 5173) {
    Write-Host "Frontend: port 5173 already in use, assuming it is running."
} else {
    Start-Process -WindowStyle Hidden -FilePath "npm.cmd" -ArgumentList "run", "dev" `
        -WorkingDirectory (Join-Path $root "frontend") `
        -RedirectStandardOutput (Join-Path $logs "frontend.log") `
        -RedirectStandardError (Join-Path $logs "frontend.err.log")
    Write-Host "Frontend started on http://localhost:5173"
}

if (Test-Port 8001) {
    Write-Host "Backend: port 8001 is already in use. Stop the other backend first." -ForegroundColor Yellow
    exit 1
}

# Backend secrets
$dbPassword = [System.Uri]::EscapeDataString((Read-Secret "PostgreSQL password"))
$env:DATABASE_URL = "postgresql+psycopg://postgres:$dbPassword@localhost:5432/medic"
Remove-Variable dbPassword

if (-not $env:ORTHANC_URL) { $env:ORTHANC_URL = "http://100.97.193.98:8042" }
if (-not $env:ORTHANC_USERNAME) { $env:ORTHANC_USERNAME = "orthanc" }
$env:ORTHANC_PASSWORD = Read-Secret "Orthanc password"

$anthropicKey = Read-Secret "Anthropic API key (Enter to skip; AI stays off)"
if ($anthropicKey) { $env:ANTHROPIC_API_KEY = $anthropicKey }
Remove-Variable anthropicKey
# Shells opened by the Claude app inherit these; they would misroute the SDK.
Remove-Item Env:ANTHROPIC_BASE_URL, Env:ANTHROPIC_AUTH_TOKEN -ErrorAction SilentlyContinue

$env:PYTHONPATH = "$root\backend;$root"

Write-Host "Starting backend on http://127.0.0.1:8001 (Orthanc: $env:ORTHANC_URL). Open http://localhost:5173"
& $python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8001 --reload --reload-dir backend
