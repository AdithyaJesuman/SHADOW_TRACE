import psycopg2
from neo4j import GraphDatabase
from src.config import BaseConfig


class PostgresDB:
    def __init__(self):
        cfg = BaseConfig.get_postgres()
        self.conn = psycopg2.connect(
            host=cfg["host"],
            port=cfg["port"],
            database=cfg["database"],
            user=cfg["user"],
            password=cfg["password"]
        )

    def cursor(self):
        return self.conn.cursor()

    def commit(self):
        self.conn.commit()

    def close(self):
        self.conn.close()


class Neo4jDB:
    def __init__(self):
        cfg = BaseConfig.get_neo4j()
        self.driver = GraphDatabase.driver(
            cfg["uri"],
            auth=(str(cfg["user"]), str(cfg["password"]))
        )

    def session(self):
        return self.driver.session(database="neo4j")

    def close(self):
        self.driver.close()
