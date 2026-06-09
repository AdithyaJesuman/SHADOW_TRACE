from .base import PostgresDB
from src.logger import logger
import uuid

def _gen_id():
    return str(uuid.uuid4())

def create create_all_tables():
    postgress=PostgresDB()
    cursor = postgress.cursor()


    #paysim dataset feature extracting ---------->>> customer table 
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS customers(
            customer_id UUID PRIMARY KEY,
            external_id VARCHAR(%) UNIQUE,
            is_fraud BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT NOW()
    );
    """)
    #paysim dataset feature extracting ---------->>> merchants table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS merchants(
            merchant_id UUID PRIMARY KEY,
            external_id VARCHAR(%) UNIQUE,
            created_at TIMESTAMP DEFAULT NOW()
        );
    """)



    #IEEE dataset feature extracting ------------->>>> cards table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS cards(
            card_id UUID PRIMARY KEY,
            card_fingerprint VARCHAR(50),
            card_network VARCHAR(25),
            card_category VARCHAR(25),
            created_at TIMESTAMP DEAFULT NOW()
        );
    """)

    #IEEE dataset feature extracting -------------->> devices table  
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS device(
            device_id UUID PRIMARY KEY,
            device_info VARCHAR(300),
            device_type VARCHAR(20),
            os VARCHAR(200),
            browser VARCHAR(200),
            screen_res VARCHAR(30),
            created_at TIMESTAMP DEFAULT NOW()
        );
    """)

    #IEEE dataset feature extracting -------------->> ips table  
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS ips(
            ip_id UUID PRIMARY KEY,
            ip_address VARCHAR(45) UNIQUE,
            country VARCHAR(10),
            vpn_flag BOOLEAN DEFAULT FALSE,
            tor_flag BOOLEAN DEFAULT FALSE
    
    
        );
    """)
    #MOTHER TABLE 
    #IEEE dataset feature extracting -------------->> transaction table  
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS transactions(
            tx_id UUID PRIMARY KEY,
            customer_id UUID REFERENCES customers(customer_id),
            merchant_id UUID REFERENCES merchants(merchant_id),
            card_id UUID REFERENCES cards(card_id),
            device_id UUID REFERENCES device(device_id),
            ip_id UUID REFERENCES ips(ip_id),
            amount FLOAT,
            tx_type VARCHAR(20),
            product_code VARCHAR(20),
            balance_before FLOAT,
            balance_after FLOAT,
            is_fraud BOOLEAN DEFAULT FALSE,
            is_flagged BOOLEAN DEFAULT FALSE,
            timestamp TIMESTAMP,
            created_at TIMESTAMP DEFAULT NOW()
            );
        """)
    #IEEE dataset feature extracting -------------->> transaction_features table 
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS transaction_features(
            feature_id UUID PRIMARY KEY,
            transaction_id UUID REFERENCES transactions(tx_id),
            c1 FLOAT,c2 FLOAT,c3 FLOAT,c5 FLOAT,c6 FLOAT,
            c7 FLOAT,c8 FLOAT,c9 FLOAT,c10 FLOAT,c11 FLOAT,
            c12 FLOAT,c13 FLOAT,c14 FLOAT,
            d1 FLOAT,d2 FLOAT,d3 FLOAT,d4 FLOAT,d5 FLOAT,
            d6 FLOAT,d7 FLOAT,d8 FLOAT,d9 FLOAT,d10 FLOAT,
            d11 FLOAT,d12 FLOAT,d13 FLOAT,d14 FLOAT,d15 FLOAT,
            m1 VARCHAR(7),m2 VARCHAR(7),m3 VARCHAR(7),m4 VARCHAR(7),m5 VARCHAR(7),
            m6 VARCHAR(7),m7 VARCHAR(7),m8 VARCHAR(7),m9 VARCHAR(7),
            created_at TIMESTAMP DEFAULT NOW()    
        );
    """)

    cursor.execute("""
            CREATE TABLE IF NOT EXISTS customer_identity (
                identity_id    UUID PRIMARY KEY,
                transaction_id UUID REFERENCES transactions(tx_id),
                customer_id    UUID REFERENCES customers(customer_id),
                id_01 FLOAT, id_02 FLOAT, id_03 FLOAT, id_04 FLOAT,
                id_05 FLOAT, id_06 FLOAT, id_07 FLOAT, id_08 FLOAT,
                id_09 FLOAT, id_10 FLOAT, id_11 FLOAT,
                id_12 VARCHAR(10), id_13 FLOAT, id_14 FLOAT,
                id_15 VARCHAR(20), id_16 VARCHAR(20),
                id_17 FLOAT, id_18 FLOAT, id_19 FLOAT, id_20 FLOAT,
                id_21 FLOAT, id_22 FLOAT,
                id_23 VARCHAR(20),
                id_24 FLOAT, id_25 FLOAT, id_26 FLOAT, id_27 FLOAT,
                id_28 VARCHAR(20), id_29 VARCHAR(20),
                id_30 VARCHAR(100), id_31 VARCHAR(100),
                id_32 FLOAT,        id_33 VARCHAR(30),
                id_34 VARCHAR(20),  id_35 VARCHAR(20),
                id_36 VARCHAR(20),  id_37 VARCHAR(20),
                id_38 VARCHAR(20),
                created_at TIMESTAMP DEFAULT NOW()
            );
        """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS login_events(
            event_id UUID PRIMARY KEY,
            customer_id UUID REFERENCES customers(customer_id),
            ip_id UUID REFERENCES devices(device_id),
            timestamp TIMESTAMP,
            created_at TIMESTAMP DEFAULT NOW()
        );
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS predictions(
            prediction_id UUID PRIMARY KEY,
            customer_id UUID REFERENCES customers(customer_id),
            fraud_score FLOAT,
            top_feature TEXT,
            scored_at TIMESTAMP DEFAULT NOW()
        );
    """)

    postress.commit()
    cursor.close()
    postgress.close()
    logger.info("all tables are sucessfully built  ")



#INSERT - one row at a time 

def insert_customer(external_id,is_fraud=false):
    





