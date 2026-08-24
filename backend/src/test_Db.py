from src.adapters.base import PostgresDB, Neo4jDB

postgres = PostgresDB()
neo = Neo4jDB()
cursor = postgres.cursor()
cursor.execute(
    "SELECT version();"
)
print(cursor.fetchone())
with neo.session() as session:

    result = session.run(
        "RETURN 'Neo4j Connected' AS msg"
    )

    print(result.single()["msg"])
postgres.close()
neo.close()