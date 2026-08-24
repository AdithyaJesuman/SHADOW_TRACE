# ==========================================
# SHADOW TRACE - Startup Script (Unified)
# ==========================================

Write-Host "🚀 Starting SHADOW TRACE Unified Engine..." -ForegroundColor Cyan
Write-Host "----------------------------------" -ForegroundColor Cyan

# 1. Start Databases
Write-Host "[1/2] Starting Databases (Postgres & Neo4j)..." -ForegroundColor Yellow

$postgresExists = docker ps -a -q -f name=postgres-db
if (!$postgresExists) {
    docker run -d --name postgres-db -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=fraud_db -p 5432:5432 postgres:15-alpine
} else {
    docker start postgres-db
}

$neo4jExists = docker ps -a -q -f name=neo4j-db
if (!$neo4jExists) {
    docker run -d --name neo4j-db -e NEO4J_AUTH=neo4j/password -p 7474:7474 -p 7687:7687 neo4j:5-community
} else {
    docker start neo4j-db
}

Start-Sleep -Seconds 3

# 2. Start FastAPI Unified Backend in a new window
Write-Host "[2/2] Starting Unified Engine (Backend + Frontend)..." -ForegroundColor Yellow
$backendCmd = "cd `"$PSScriptRoot\backend`"; Write-Host 'Starting Unified Engine...'; uvicorn app.main:app --host 0.0.0.0 --port 8000"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd

Write-Host "----------------------------------" -ForegroundColor Cyan
Write-Host "✅ All systems are booting up!" -ForegroundColor Green
Write-Host "👉 Application is available at: http://localhost:8000" -ForegroundColor White
Write-Host "You can close this specific terminal window now if you want." -ForegroundColor Gray
