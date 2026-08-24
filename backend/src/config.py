import yaml
from pathlib import Path
config_path = Path("config.yaml")
with open(config_path, "r") as f:
    CONFIG = yaml.safe_load(f)
class BaseConfig:
    @staticmethod
    def get_postgres():
        return CONFIG["postgres"]
    @staticmethod
    def get_neo4j():
        return CONFIG["neo4j"]
    @staticmethod
    def get_redis():
        return CONFIG["redis"]
