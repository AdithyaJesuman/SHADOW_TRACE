@echo off
echo ==========================================
echo SHADOW TRACE - Full Stack Startup (Front, Back, ML)
echo ==========================================
echo.

echo [1/4] Starting Databases (Postgres & Neo4j)...
docker start postgres-db 2>NUL || docker run -d --name postgres-db -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=fraud_db -p 5432:5432 postgres:15-alpine
docker start neo4j-db 2>NUL || docker run -d --name neo4j-db -e NEO4J_AUTH=neo4j/password -p 7474:7474 -p 7687:7687 neo4j:5-community

timeout /t 3 /nobreak > NUL

echo [2/4] Starting FastAPI Backend...
start "Shadow Trace - BACKEND" powershell -NoExit -Command "cd '%~dp0\backend'; Write-Host 'Running Backend...'; uvicorn app.main:app --host 0.0.0.0 --port 8000"

echo [3/4] Starting React Frontend...
start "Shadow Trace - FRONTEND" powershell -NoExit -Command "cd '%~dp0\frontend'; Write-Host 'Running Frontend...'; docker run --rm -v '%~dp0\frontend:/app' -w /app -p 5173:5173 node:20-alpine sh -c 'npm install && npm run dev -- --host 0.0.0.0'"

echo [4/4] Starting ML Engine Environment...
start "Shadow Trace - ML ENGINE" powershell -NoExit -Command "cd '%~dp0\ml'; Write-Host 'ML Engine terminal ready. You can run your ML python scripts here.' -ForegroundColor Green"

echo.
echo ==========================================
echo All 3 environments are launching in separate windows!
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
echo ML Engine: Ready in terminal
echo ==========================================
pause
