@echo off
echo ==========================================
echo SHADOW TRACE - One-Click Startup (Unified)
echo ==========================================
echo.

echo [1/2] Starting Databases (Postgres & Neo4j)...
docker start postgres-db 2>NUL || docker run -d --name postgres-db -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=fraud_db -p 5432:5432 postgres:15-alpine
docker start neo4j-db 2>NUL || docker run -d --name neo4j-db -e NEO4J_AUTH=neo4j/password -p 7474:7474 -p 7687:7687 neo4j:5-community

timeout /t 3 /nobreak > NUL

echo [2/2] Starting Unified Engine (Backend + Frontend)...
start "Shadow Trace Unified Engine" powershell -NoExit -Command "cd 'C:\Users\adith\OneDrive\Desktop\db+fast api'; uvicorn app.main:app --host 0.0.0.0 --port 8000"

echo.
echo ==========================================
echo All systems are launching!
echo Application is available at: http://localhost:8000
echo ==========================================
pause
