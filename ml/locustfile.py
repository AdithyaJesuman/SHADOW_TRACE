from locust import HttpUser, task, between
import random

class FastAPILoadTest(HttpUser):
    # 0 wait time to blast the API continuously
    wait_time = between(0.0, 0.0)

    @task
    def create_transaction(self):
        tx_types = ["PAYMENT", "TRANSFER", "CASH_OUT", "DEBIT", "CASH_IN"]
        tx_data = {
            "transaction_id": f"tx-{random.randint(10000, 99999)}",
            "customer_id": f"C{random.randint(10000, 99999)}",
            "amount": round(random.uniform(10.0, 5000.0), 2),
            "tx_type": random.choice(tx_types),
            "timestamp": "2024-01-01T10:00:00",
            "location_id": "loc-1",
            "device_id": "dev-1",
            "ip_address": "127.0.0.1",
            "merchant_id": "merch-1"
        }
        
        # We don't catch exceptions here so Locust can automatically track failures
        self.client.post("/transactions", json=tx_data)
