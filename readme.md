<div align="center">

<!-- ANIMATED BANNER -->
<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0f0c29,50:302b63,100:24243e&height=200&section=header&text=Fraud%20Ring%20Intelligence&fontSize=48&fontColor=ffffff&fontAlignY=38&desc=Graph-Powered%20Real-Time%20Fraud%20Detection%20Pipeline&descAlignY=58&descSize=18&animation=fadeIn" width="100%"/>

<br/>

<!-- BADGES ROW 1 -->
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![Neo4j](https://img.shields.io/badge/Neo4j-5.20-008CC1?style=for-the-badge&logo=neo4j&logoColor=white)](https://neo4j.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Apache Kafka](https://img.shields.io/badge/Apache%20Kafka-2.3-231F20?style=for-the-badge&logo=apachekafka&logoColor=white)](https://kafka.apache.org)

<!-- BADGES ROW 2 -->
[![PyTorch](https://img.shields.io/badge/PyTorch-2.3-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white)](https://pytorch.org)
[![PyG](https://img.shields.io/badge/PyG-2.5.3-3C2179?style=for-the-badge&logo=pyg&logoColor=white)](https://pyg.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![MLflow](https://img.shields.io/badge/MLflow-2.13-0194E2?style=for-the-badge&logo=mlflow&logoColor=white)](https://mlflow.org)

<!-- BADGES ROW 3 -->
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com)
[![Redis](https://img.shields.io/badge/Redis-5.0-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io)
[![License](https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Active%20Development-f59e0b?style=for-the-badge)]()

<br/>

> **An end-to-end fraud intelligence system combining knowledge graphs, graph neural networks,**  
> **real-time streaming, and classical ML to detect coordinated fraud rings at scale.**

<br/>

[🚀 Quick Start](#-quick-start) • [🏗️ Architecture](#%EF%B8%8F-architecture) • [📊 Datasets](#-datasets) • [🧠 ML Pipeline](#-ml-pipeline) • [📁 Project Structure](#-project-structure) • [🛣️ Roadmap](#%EF%B8%8F-roadmap)

</div>

---

## 🌟 What Makes This Different

Most fraud detection systems look at transactions **in isolation**.  
This system looks at **the entire network** — who shares a device, an IP, a card, an email — and finds coordinated rings that traditional ML completely misses.

```
Traditional approach:               This system:

Transaction → Score                 User ─── Device ─── User
                                      │                    │
   ❌ Misses rings                  IP ──────────────── Card
   ❌ No graph context                │
   ❌ Reactive                      Merchant
                                    
                                      ✅ Detects rings
                                      ✅ Graph-aware scoring
                                      ✅ Real-time streaming
```

---

## 🏗️ Architecture

```
╔══════════════════════════════════════════════════════════════════════╗
║                        DATA SOURCES                                  ║
║   PaySim (6.3M txns)  ·  IEEE-CIS (590K txns)  ·  Elliptic (GNN)   ║
╚══════════════════════════╦═══════════════════════════════════════════╝
                           ▼
╔══════════════════════════════════════════════════════════════════════╗
║                    KAFKA STREAMING LAYER                             ║
║         transactions_raw  ·  fraud_alerts  ·  login_events          ║
╚══════════════════════════╦═══════════════════════════════════════════╝
                           ▼
╔══════════════════════════════════════════════════════════════════════╗
║                    db.py  ─  INGESTION ORCHESTRATOR                  ║
╚═════════════════╦════════════════════════╦════════════════════════════╝
                  ▼                        ▼
╔═════════════════════════╗  ╔═════════════════════════════════════════╗
║     POSTGRESQL          ║  ║              NEO4J                      ║
║                         ║  ║                                         ║
║  customers              ║  ║  (:Customer)-[:MADE]->(:Transaction)   ║
║  transactions           ║  ║  (:Customer)-[:USES]->(:Device)        ║
║  devices · cards · ips  ║  ║  (:Customer)-[:OWNS]->(:Card)          ║
║  transaction_features   ║  ║  (:Customer)-[:LOGGED_FROM]->(:IP)     ║
║  predictions            ║  ║  (:IP)-[:LOCATED_IN]->(:Country)       ║
╚═════════════════════════╝  ╚═════════════════════════════════════════╝
                  ║                        ║
                  ╚═══════════╦════════════╝
                              ▼
╔══════════════════════════════════════════════════════════════════════╗
║                    FEATURE ENGINEERING  (features.py)               ║
║  tx_velocity · balance_drain · shared_device_count · pagerank       ║
║  fraud_neighbor_ratio · betweenness · country_risk · night_ratio    ║
╚══════════════════════════╦═══════════════════════════════════════════╝
                           ▼
╔══════════════════════════════════════════════════════════════════════╗
║                       ML PIPELINE  (model.py)                       ║
║                                                                      ║
║   NetworkX Graph ──► Node2Vec ──► GraphSAGE/GAT ──► Embeddings      ║
║                                                           │          ║
║   Feature Matrix ─────────────────────────────────────►  │          ║
║                                                           ▼          ║
║                                              XGBoost · LightGBM      ║
║                                              HDBSCAN · IsolationForest║
╚══════════════════════════╦═══════════════════════════════════════════╝
                           ▼
╔══════════════════════════════════════════════════════════════════════╗
║               FRAUD PROBABILITY SCORE  ·  0.0 → 1.0                 ║
╚══════╦══════════════╦══════════════════╦═══════════════╦═════════════╝
       ▼              ▼                  ▼               ▼
  FastAPI         Kafka Alert        Pyvis Graph      MLflow
  /score         fraud_alerts        Ring Visual      Tracking
```

---

## 📊 Datasets

| Dataset | Purpose | Size | Source |
|---------|---------|------|--------|
| **PaySim** | Core transactions, customer + merchant nodes | 6.3M rows | [Kaggle](https://kaggle.com/datasets/ealaxi/paysim1) |
| **IEEE-CIS Transaction** | Card data, email nodes, enriched features | 590K rows | [Kaggle](https://kaggle.com/c/ieee-fraud-detection) |
| **IEEE-CIS Identity** | Device, browser, OS nodes | 144K rows | [Kaggle](https://kaggle.com/c/ieee-fraud-detection) |
| **Elliptic Bitcoin** | GNN pre-training only | 203K nodes | [Kaggle](https://kaggle.com/datasets/ellipticco/elliptic-data-set) |
| **DB-IP Geolocation** | IP → Country enrichment | ~3.2M rows | [db-ip.com](https://db-ip.com/db/download/ip-to-country-lite) |

```
data/
├── raw/
│   ├── paysim/         ← PS_20174392719_1491204439457_log.csv
│   ├── ieee/           ← train_transaction.csv · train_identity.csv
│   ├── elliptic/       ← elliptic_txs_features · classes · edgelist
│   └── ip/             ← dbip-country-lite.csv
└── processed/          ← pipeline writes cleaned DataFrames here
```

---

## ⚡ Quick Start

### Prerequisites

- Python 3.11
- Docker Desktop
- Neo4j Desktop
- Conda

### 1 — Clone and create environment

```bash
git clone https://github.com/yourusername/fraud_detection.git
cd fraud_detection

conda create -n fraud_detection python=3.11.9 -y
conda activate fraud_detection
pip install --upgrade pip
```

### 2 — Start databases

```bash
# PostgreSQL via Docker
docker run --name postgres-fraud \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=fraud_db \
  -p 5432:5432 -d postgres

# Redis via Docker
docker run --name redis-fraud \
  -p 6379:6379 -d redis

# Kafka via Docker
docker run -d --name kafka \
  -p 9092:9092 apache/kafka:latest
```

> **Neo4j** — open Neo4j Desktop, create a new database, set password, click Start.  
> Bolt port will be `bolt://localhost:7687`

### 3 — Configure

```bash
cp .env.example .env
# Fill in your passwords in .env
```

```yaml
# config.yaml is pre-filled with localhost defaults
# Only change if your ports differ
```

### 4 — Install dependencies

```bash
# All packages
pip install neo4j==5.20.0 psycopg2-binary==2.9.9 redis==5.0.4 \
  sqlalchemy==2.0.30 confluent-kafka==2.3.0 pandas==2.2.2 \
  numpy==1.26.4 pyarrow==16.0.0 scipy==1.13.0 networkx==3.3 \
  node2vec==0.5.0 scikit-learn==1.4.2 xgboost==2.0.3 \
  lightgbm==4.3.0 imbalanced-learn==0.12.3 matplotlib==3.9.0 \
  seaborn==0.13.2 pyvis==0.3.2 plotly==5.22.0 fastapi==0.111.0 \
  uvicorn==0.29.0 pydantic==2.7.1 python-multipart==0.0.9 \
  httpx==0.27.0 pyyaml==6.0.1 python-dotenv==1.0.1 tqdm==4.66.4 \
  loguru==0.7.2 tenacity==8.3.0 mlflow==2.13.0 apscheduler==3.10.4 \
  celery==5.4.0 prometheus-client==0.20.0 evidently==0.4.30 \
  pytest==8.2.0 pytest-asyncio==0.23.7

# PyTorch + PyG (CPU)
pip install torch==2.3.0
pip install torch-geometric==2.5.3
pip install pyg_lib torch_scatter torch_sparse torch_cluster \
  torch_spline_conv \
  -f https://data.pyg.org/whl/torch-2.3.0+cpu.html
```

### 5 — Create Kafka topics

```bash
docker exec kafka /opt/kafka/bin/kafka-topics.sh \
  --create --topic transactions_raw \
  --bootstrap-server localhost:9092

docker exec kafka /opt/kafka/bin/kafka-topics.sh \
  --create --topic fraud_alerts \
  --bootstrap-server localhost:9092
```

### 6 — Run

```bash
# Create all tables and seed databases
python main.py --setup

# Run full pipeline
python main.py --pipeline

# Start API server
uvicorn src.main:app --reload

# Start real-time consumer (separate terminal)
python src/kafka_consumer.py

# Launch MLflow UI
mlflow ui  # → localhost:5000
```

---

## 🧠 ML Pipeline

```
Step 1 — Node2Vec
  NetworkX graph → random walks → 128-dim node embeddings
  Captures graph topology: who is connected to whom

Step 2 — GraphSAGE (PyTorch Geometric)
  Node2Vec embeddings as input features
  Pre-trained on Elliptic Bitcoin dataset
  Fine-tuned on PaySim + IEEE graph
  Output: refined fraud-aware embeddings

Step 3 — Classical ML
  GNN embeddings + engineered features → XGBoost / LightGBM
  Isolation Forest for unsupervised anomaly scoring
  HDBSCAN for community/cluster detection

Step 4 — Final Score
  Weighted combination → 0.0 to 1.0 fraud probability
  SHAP values → which features drove the score
  Stored in PostgreSQL predictions table
```

### Fraud Patterns Detected

| Pattern | How It's Found | Query |
|--------|---------------|-------|
| **Shared Device Ring** | 3+ users → same device fingerprint | `SHARED_DEVICE_QUERY` |
| **Shared IP Ring** | 3+ users → same IP address | `SHARED_IP_QUERY` |
| **Shared Card Fraud** | 2+ users → same card | `SHARED_CARD_QUERY` |
| **Email Cluster** | Users sharing disposable email domains | `SHARED_EMAIL_QUERY` |
| **Velocity Burst** | 10+ transactions in 1 hour | `features.py` |
| **Night Pattern** | 70%+ transactions between 11pm–5am | `features.py` |
| **VPN + High Value** | VPN IP + transaction > threshold | `registry.py` |

---

## 📁 Project Structure

```
fraud_detection/
│
├── 📂 src/
│   ├── 📂 adapters/
│   │   ├── __init__.py
│   │   ├── base.py          ← Neo4j driver · Postgres engine · Redis client
│   │   ├── neo.py           ← All Neo4j node + relationship functions
│   │   └── ps.py            ← All PostgreSQL table + insert + query functions
│   │
│   ├── analysis.py          ← Cypher queries → NetworkX graph export
│   ├── config.py            ← Reads config.yaml + .env
│   ├── db.py                ← Ingestion orchestrator (calls both adapters)
│   ├── features.py          ← Feature matrix builder (Postgres + Neo4j)
│   ├── kafka_consumer.py    ← Real-time transaction consumer + scorer
│   ├── kafka_producer.py    ← Fraud alert publisher with Redis dedup
│   ├── logger.py            ← Loguru config · file + console sinks
│   ├── model.py             ← Node2Vec → GraphSAGE → XGBoost → score
│   ├── pipeline.py          ← Master runner (CSV → DB → Graph → ML → Alert)
│   ├── queries.py           ← All Cypher strings as constants
│   ├── registry.py          ← All thresholds and constants
│   ├── visualize.py         ← Pyvis fraud rings · Plotly dashboards
│   └── main.py              ← Entry point
│
├── 📂 data/
│   ├── raw/                 ← Original CSV files (git-ignored)
│   └── processed/           ← Cleaned DataFrames
│
├── 📂 output/
│   ├── logs/                ← fraud.log (rotates at 10MB)
│   ├── graphs/              ← Pyvis HTML fraud ring visualizations
│   ├── embeddings/          ← Saved Node2Vec embeddings (.pkl)
│   └── models/              ← Trained model weights
│
├── config.yaml              ← DB URLs · Kafka topics · model hyperparams
├── .env                     ← Passwords (never commit this)
├── .env.example             ← Template for .env
├── requirements.txt
└── README.md
```

---

## 🔌 API Reference

Start the server: `uvicorn src.main:app --reload`  
Interactive docs: `http://localhost:8000/docs`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/score/{user_id}` | `GET` | Returns fraud probability + top contributing features |
| `/ring/{user_id}` | `GET` | Returns the fraud ring subgraph for a user |
| `/alerts` | `GET` | Returns all high-score predictions above threshold |
| `/health` | `GET` | Returns service health status |
| `/metrics` | `GET` | Prometheus metrics (transactions scored, alerts fired, latency) |

### Example Response

```json
{
  "user_id": "U0012483",
  "fraud_score": 0.923,
  "risk_level": "HIGH",
  "top_features": [
    { "feature": "shared_device_count", "contribution": 0.41 },
    { "feature": "tx_velocity_1h",      "contribution": 0.29 },
    { "feature": "vpn_flag",            "contribution": 0.18 }
  ],
  "ring_members": ["U0012483", "U0019234", "U0045821"],
  "shared_entities": {
    "devices": ["D_8f3a2b"],
    "ips": ["192.168.1.1"]
  },
  "scored_at": "2025-06-10T14:32:11Z"
}
```

---

## 📈 Neo4j Graph Schema

### Nodes

| Label | Key Property | Source |
|-------|-------------|--------|
| `(:Customer)` | `customer_id` | PaySim nameOrig |
| `(:Transaction)` | `tx_id` | PaySim + IEEE |
| `(:Device)` | `device_id` | IEEE identity |
| `(:Card)` | `card_id` | IEEE transaction |
| `(:IP)` | `address` | DB-IP + enrichment |
| `(:Email)` | `domain` | IEEE P/R_emaildomain |
| `(:Merchant)` | `merchant_id` | PaySim nameDest |
| `(:Country)` | `code` | DB-IP |
| `(:BitcoinTx)` | `tx_id` | Elliptic (GNN only) |

### Relationships

```cypher
(Customer)-[:MADE]->(Transaction)
(Transaction)-[:TO]->(Customer)
(Transaction)-[:TO]->(Merchant)
(Customer)-[:USES]->(Device)
(Customer)-[:OWNS]->(Card)
(Customer)-[:USES_EMAIL]->(Email)
(Customer)-[:LOGGED_FROM]->(IP)
(Transaction)-[:USED_CARD]->(Card)
(Transaction)-[:USED_DEVICE]->(Device)
(Transaction)-[:USED_IP]->(IP)
(IP)-[:LOCATED_IN]->(Country)
(BitcoinTx)-[:TRANSFERRED_TO]->(BitcoinTx)
```

---

## 🗃️ PostgreSQL Schema

```sql
customers            — customer_id · external_id · is_fraud
transactions         — tx_id · customer_id · merchant_id · card_id
                       device_id · ip_id · amount · is_fraud · timestamp
cards                — card_id · card_fingerprint · card_network
devices              — device_id · device_info · os · browser
ips                  — ip_id · ip_address · country · vpn_flag · tor_flag
transaction_features — C1–C14 · D1–D15 · M1–M9 (IEEE columns)
customer_identity    — id_01–id_38 (IEEE identity columns)
login_events         — event_id · customer_id · ip_id · device_id
predictions          — customer_id · fraud_score · top_features · scored_at
```

---

## 🛣️ Roadmap

- [x] PostgreSQL schema and ingestion
- [x] Neo4j graph schema and ingestion
- [x] PaySim dataset pipeline
- [x] IEEE-CIS dataset pipeline
- [ ] Node2Vec embeddings
- [ ] GraphSAGE training on Elliptic
- [ ] Feature engineering matrix
- [ ] XGBoost + Isolation Forest scoring
- [ ] Kafka producer / consumer
- [ ] FastAPI scoring endpoint
- [ ] Pyvis fraud ring visualization
- [ ] MLflow experiment tracking
- [ ] SHAP explainability layer
- [ ] Prometheus metrics
- [ ] Evidently drift monitoring
- [ ] Plaid sandbox webhook integration
- [ ] Stripe webhook + real-time scoring
- [ ] Temporal GNN upgrade

---

## 🧰 Tech Stack

<div align="center">

| Layer | Technology |
|-------|-----------|
| **Graph Database** | Neo4j 5.20 |
| **Relational DB** | PostgreSQL 16 (Docker) |
| **Cache** | Redis 5.0 (Docker) |
| **Streaming** | Apache Kafka + confluent-kafka |
| **Graph ML** | PyTorch Geometric 2.5.3 · GraphSAGE · GAT |
| **Graph Embeddings** | Node2Vec 0.5.0 |
| **Classical ML** | XGBoost · LightGBM · Isolation Forest · HDBSCAN |
| **Graph Library** | NetworkX 3.3 |
| **API** | FastAPI 0.111 + Uvicorn |
| **Experiment Tracking** | MLflow 2.13 |
| **Monitoring** | Prometheus · Evidently |
| **Scheduling** | Celery · APScheduler |
| **Visualization** | Pyvis · Plotly · Seaborn |
| **Config** | PyYAML · python-dotenv |
| **Logging** | Loguru |

</div>

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:24243e,50:302b63,100:0f0c29&height=120&section=footer&animation=fadeIn" width="100%"/>

**Built with obsession for catching fraud rings at graph scale.**

[![GitHub stars](https://img.shields.io/github/stars/AdithyaJesuman/shadow?style=social)](https://github.com/AdithyaJesuman/shadow)

</div>
