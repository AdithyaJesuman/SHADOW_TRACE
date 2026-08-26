import json
import uuid
from datetime import datetime
from confluent_kafka import Producer, KafkaException
from backend.src.logger import logger

class CustomJSONEncoder(json.JSONEncoder):
    def default(self,obj):
        if isinstance(obj,uuid.UUID):
            return str(obj)
        if isinstance(obj,datetime):
            return obj.isoformat()
        return super().default(obj)
    
def delivery_report(err, msg):
    if err is not None:
        logger.error(f"❌ KAFKA FAILED: Delivery failed for record {msg.key()}: {err}")
    else:
        logger.debug(f"✅ KAFKA SUCCESS: Topic {msg.topic()} | Partition {msg.partition()}")


logger.info("Intiallizing kafka producer")
conf={
    'bootstrap.servers':'localhost:9092',
    'client.id':'shadow-trace-api',
    'linger.ms':5,
    'compression.type':'lz4',
    'acks':'all',
    'retries':5,
    'message.timeout.ms':10000
}
producer=Producer(conf)

def send_transactions(topic:str,key:str,value:dict):
    try:
        key_bytes=key.encode('utf-8')
        value_bytes=json.dumps(value,cls=CustomJSONEncoder).encode('utf-8')
        producer.produce(topic=topic,key=key_bytes,value=value_bytes,callback=delivery_report)
    except BufferError:
        logger.critical("KAFKA BUFFER FULL: Message dropped")
        raise Exception("Kafka queue full cannot accept transactions at this time")
        
    except KafkaException as e:
        logger.error(f"KAFKA FATAL ERROR:{str(e)}")
        raise


def trigger_callback():
    producer.poll(0)

def shutdown_producer():
    logger.warning("flushing kafka producer queue before shutdown")
    remaining=producer.flush(10.0)

    if remaining > 0:
        logger.error(f"KAFKA SHUTDOWN: {remaining} messages were lost!")
    else:
        logger.info("KAFKA SHUTDOWN: All messages flushed successfully.")



