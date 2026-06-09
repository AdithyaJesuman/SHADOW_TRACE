from src.adapters.base import Neo4jDB
neo4j = Neo4jDB()
session = neo4j.session()


session.close()
neo4j.close()
