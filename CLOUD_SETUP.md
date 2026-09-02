# SHADOW TRACE - Cloud Database Setup Guide

## Overview
Your SHADOW TRACE deployment is now cloud-ready. Local services have been removed; configure your cloud instances below.

---

## Cloud Service Setup

### 1. PostgreSQL (Primary Database)

**Options:**
- **Supabase** (Recommended - easiest): https://supabase.com
- **AWS RDS**: https://aws.amazon.com/rds/postgresql/
- **DigitalOcean Managed DB**: https://www.digitalocean.com/products/managed-databases/

**Setup Steps (Supabase):**
1. Create project at supabase.com
2. Navigate to **Settings > Database**
3. Copy connection string from "Connection pooling"
4. Format: `postgresql+asyncpg://user:password@db.xxxxx.supabase.co:5432/fraud_db`
5. Add to `.env`:
   ```
   DATABASE_URL=postgresql+asyncpg://user:password@db.xxxxx.supabase.co:5432/fraud_db
   ```

**Test connection:**
```bash
psql postgresql://user:password@db.xxxxx.supabase.co:5432/fraud_db
```

---

### 2. Neo4j (Graph Database)

**Options:**
- **Neo4j Aura** (Managed Cloud): https://neo4j.com/cloud/aura/
- **Self-hosted on EC2/Droplet**: Docker image `neo4j:5-community`

**Setup Steps (Neo4j Aura):**
1. Create instance at neo4j.com/cloud/aura
2. Choose "Free" tier for development
3. Copy **Connection URI** (starts with `neo4j+s://`)
4. Create username/password in console
5. Add to `.env`:
   ```
   NEO4J_URI=neo4j+s://xxxxxxxx.databases.neo4j.io
   NEO4J_USER=neo4juser
   NEO4J_PASSWORD=your_secure_password
   ```

---

### 3. Kafka (Event Streaming)

**Options:**
- **Confluent Cloud** (Managed): https://confluent.cloud
- **AWS MSK** (Managed): https://aws.amazon.com/msk/
- **Upstash Kafka** (Serverless): https://upstash.com/kafka

**Setup Steps (Confluent Cloud):**
1. Create cluster at confluent.cloud
2. Create topic: `transactions_raw`, `login_events_raw`
3. Generate API key (Settings > API Keys)
4. Connection string: `pkc-xxxxx.region.provider.confluent.cloud:9092`
5. Add to `.env`:
   ```
   KAFKA_BOOTSTRAP_SERVERS=pkc-xxxxx.region.provider.confluent.cloud:9092
   KAFKA_SECURITY_PROTOCOL=SASL_SSL
   KAFKA_SASL_MECHANISM=PLAIN
   KAFKA_SASL_USERNAME=YOUR_API_KEY
   KAFKA_SASL_PASSWORD=YOUR_API_SECRET
   ```

---

### 4. Redis (Cache)

**Options:**
- **Upstash** (Serverless): https://upstash.com/redis
- **AWS ElastiCache**: https://aws.amazon.com/elasticache/
- **Redis Cloud**: https://redis.com/try-free/

**Setup Steps (Upstash):**
1. Create database at upstash.com
2. Copy "Redis URL" from console (includes auth token)
3. Format: `rediss://default:token@host:6379`
4. Add to `.env`:
   ```
   REDIS_URL=rediss://default:your_token@db-xxxxx.upstash.io:6379
   ```

---

## Deployment Instructions

### 1. Clone `.env` from template:
```bash
cp .env.example .env
```

### 2. Edit `.env` with your cloud credentials:
```bash
nano .env
```

### 3. Build and run:
```bash
docker compose up --build --pull always
```

### 4. Verify health:
```bash
curl http://localhost:8000/health
```

### 5. Check logs:
```bash
docker compose logs shadow-trace-api
```

---

## Network Configuration

### VPC / Security Groups
- Allow FastAPI container outbound to PostgreSQL, Neo4j, Kafka, Redis
- Whitelist container IP or use VPC endpoint if on same cloud provider

### Local Development
- Create `.env` locally with cloud credentials
- `docker compose up` connects to cloud services
- No local database overhead

---

## CI/CD Integration

### GitHub Actions Example:
```yaml
name: Deploy to Cloud

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build image
        run: docker build -t shadow-trace:${{ github.sha }} .
      - name: Push to registry
        run: docker push your-registry/shadow-trace:${{ github.sha }}
      - name: Deploy
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          NEO4J_URI: ${{ secrets.NEO4J_URI }}
          KAFKA_BOOTSTRAP_SERVERS: ${{ secrets.KAFKA_BOOTSTRAP_SERVERS }}
          REDIS_URL: ${{ secrets.REDIS_URL }}
        run: |
          docker compose pull
          docker compose up -d shadow-trace-api
```

---

## Troubleshooting

### Connection Timeout to PostgreSQL
- Check VPC / security group allows outbound to port 5432
- Verify `DATABASE_URL` format and credentials
- Test: `psql $DATABASE_URL`

### Neo4j Authentication Failed
- Verify `NEO4J_USER` and `NEO4J_PASSWORD` match your Aura console
- Use `neo4j+s://` (SSL) for Aura, not `bolt://`

### Kafka Broker Not Reachable
- Check `KAFKA_SECURITY_PROTOCOL` matches broker config (SASL_SSL for Confluent Cloud)
- Verify API key/secret are correct
- Create topics manually in cloud console if needed

### Redis Connection Refused
- Ensure `rediss://` (with SSL) for Upstash
- Check token in URL is not expired
- Verify inbound allow rule on ElastiCache security group

---

## Cost Optimization

| Service | Free Tier | Cost/Month (Prod) |
|---------|-----------|-------------------|
| Supabase PostgreSQL | 500MB storage | $25-100+ |
| Neo4j Aura | 1 free instance | $35-100+ |
| Confluent Cloud | $100 credit | $30-200+ |
| Upstash Redis | 10GB/day | $0.20 per million cmds |

**Recommendation:** Start with free tiers for dev, scale as needed.

---

## Next Steps
1. ✅ Set up PostgreSQL
2. ✅ Set up Neo4j
3. ✅ Set up Kafka
4. ✅ Set up Redis
5. Deploy FastAPI container
6. Run integration tests
7. Monitor with Prometheus/Grafana (optional)
