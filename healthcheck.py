#!/usr/bin/env python3
"""
Health check script for SHADOW TRACE cloud services.
Validates connections to PostgreSQL, Neo4j, and Redis before container startup.
"""

import os
import sys
import asyncio
from dotenv import load_dotenv

load_dotenv()

async def check_postgres():
    """Test PostgreSQL connection"""
    try:
        import asyncpg
        url = os.getenv("DATABASE_URL")
        if not url:
            print("❌ DATABASE_URL not set")
            return False
        
        # Parse connection string
        from sqlalchemy.engine.url import make_url
        parsed = make_url(url)
        
        conn = await asyncpg.connect(
            host=parsed.host,
            port=parsed.port or 5432,
            user=parsed.username,
            password=parsed.password,
            database=parsed.database
        )
        await conn.close()
        print("✅ PostgreSQL (Supabase) connected")
        return True
    except Exception as e:
        print(f"❌ PostgreSQL connection failed: {e}")
        return False

async def check_neo4j():
    """Test Neo4j connection"""
    try:
        from neo4j import AsyncGraphDatabase
        
        uri = os.getenv("NEO4J_URI")
        user = os.getenv("NEO4J_USER")
        password = os.getenv("NEO4J_PASSWORD")
        
        if not all([uri, user, password]):
            print("❌ Neo4j credentials not set")
            return False
        
        driver = AsyncGraphDatabase.driver(uri, auth=(user, password))
        async with driver.session() as session:
            result = await session.run("RETURN 1")
            await result.consume()
        await driver.close()
        print("✅ Neo4j (Aura) connected")
        return True
    except Exception as e:
        print(f"❌ Neo4j connection failed: {e}")
        return False

async def check_redis():
    """Test Redis connection"""
    try:
        import redis.asyncio as redis
        
        url = os.getenv("REDIS_URL")
        if not url:
            print("❌ REDIS_URL not set")
            return False
        
        client = redis.from_url(url, decode_responses=True)
        await client.ping()
        await client.close()
        print("✅ Redis (Upstash) connected")
        return True
    except Exception as e:
        print(f"❌ Redis connection failed: {e}")
        return False

async def main():
    """Run all checks"""
    print("\n" + "="*60)
    print("SHADOW TRACE - Cloud Services Health Check")
    print("="*60 + "\n")
    
    results = {
        "PostgreSQL": await check_postgres(),
        "Neo4j": await check_neo4j(),
        "Redis": await check_redis(),
    }
    
    print("\n" + "="*60)
    passed = sum(results.values())
    total = len(results)
    print(f"Results: {passed}/{total} services connected")
    print("="*60 + "\n")
    
    if passed == total:
        print("✅ All cloud services ready!")
        return 0
    else:
        print("❌ Some services failed. Check .env credentials.")
        return 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
