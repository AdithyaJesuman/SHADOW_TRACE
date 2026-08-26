import json
import asyncio
from confluent_kafka import Consumer
from backend.src.adapters import ps
from backend.src.logger import logger

conf={'bootstrap.servers':'localhost:9092',
      'group.id':'shadow-trace-db-writer',
      'auto.offset.reset':'earliest'}

consumer=Consumer(conf)

consumer.subscribe(['transactions_raw','login_events_raw'])

async def process_transaction(data:dict):
    customer_id=await ps.insert_customer(external_id=data['customer_id'])

    await ps.insert_transaction(
        customer_id=customer_id,
        amount=data['amount'],
        tx_type=data['tx_type'],
        is_fraud=data.get('is_fraud',False)
    )
    logger.info(f"DB Saved Transaction: ${data['amount']} for {data['customer_id']}")

async def process_login_event(data:dict):
    customer_id = await ps.insert_customer(external_id=data['customer_external_id'])
    await ps.insert_login_event(customer_id=customer_id,success=data.get('success',True))
    logger.info(f"✅ DB Saved Login Event for {data['customer_external_id']}")
async def run_consumer():
    
    await ps.create_all_tables()
    logger.info("🎧 Kafka Consumer started. Listening for events...")
    try:
        while True:
            
            msg = consumer.poll(1.0)
            
            if msg is None: 
                continue 
                
            if msg.error():
                logger.error(f"❌ Kafka Error: {msg.error()}")
                continue
            
            topic = msg.topic()
            data = json.loads(msg.value().decode('utf-8'))
            
            if topic == "transactions_raw":
                await process_transaction(data)
            
            elif topic == "login_events_raw":
                await process_login_event(data)
    except KeyboardInterrupt:
        logger.info("🛑 Shutting down consumer manually...")
    finally:
        consumer.close()

if __name__=="__main__":
    asyncio.run(run_consumer())
