# ==========================================
# SHADOW TRACE - Startup Script
# ==========================================

Write-Host "🚀 Starting SHADOW TRACE..." -ForegroundColor Cyan
Write-Host "----------------------------------" -ForegroundColor Cyan

# 1. Start Databases (Checks if they exist, starts them if they do, creates them if they don't)
Write-Host "[1/3] Starting Databases (Postgres & Neo4j)..." -ForegroundColor Yellow

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

# 2. Start FastAPI Backend in a new window
Write-Host "[2/3] Starting FastAPI Backend (Port 8000)..." -ForegroundColor Yellow
$backendCmd = "cd 'C:\Users\adith\OneDrive\Desktop\db+fast api'; Write-Host 'Starting Backend...'; uvicorn app.main:app --host 0.0.0.0 --port 8000"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd

# 3. Start React Frontend in a new window
Write-Host "[3/3] Starting React Frontend (Port 5173)..." -ForegroundColor Yellow
$frontendCmd = "cd 'C:\Users\adith\OneDrive\Desktop\db+fast api\frontend'; Write-Host 'Starting Frontend Docker...'; docker run --rm -v `"C:\Users\adith\OneDrive\Desktop\db+fast api\frontend:/app`" -w /app -p 5173:5173 node:20-alpine sh -c `"npm install && npm run dev -- --host 0.0.0.0`""
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd

Write-Host "----------------------------------" -ForegroundColor Cyan
Write-Host "✅ All systems are booting up in separate windows!" -ForegroundColor Green
Write-Host "👉 Backend will be at: http://localhost:8000" -ForegroundColor White
Write-Host "👉 Dashboard will be at: http://localhost:5173" -ForegroundColor White
Write-Host "You can close this specific terminal window now if you want." -ForegroundColor Gray
