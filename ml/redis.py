import time
import uuid
from dataclasses import dataclass
from typing import Optional, Tuple
import redis

@dataclass(frozen=True)
class FraudEvaluation:
    is_approved:bool
    rejection_reason:Optional[str]=None
    velocity_count:int=0
    latency_ms:float=0.0

class ShadowTraceRedisGuard:
    def __init__(self,host:str="localhost",port:int=6379,db:int=0):
        self.pool = redis.ConnectionPool(
            host=host,
            port=port,
            db=db,
            decode_responses=True,
            max_connection=50
            socket_timeout=1.0,
            socket_connect_timeout=1.0  
        )
        self.r=redis.Redis(connection_pool=self.pool)
        self.BLACKLIST_KEY="shadowtrace:blocked_cards"
        self.VELOCITY_KEY_PREFIX="shadowtrace:velocity"

    def add_card_to_blacklist(self,card_hash:str)->None:
        self.r.sadd(self.BLACKLIST_KEY,card_hash)

    def remoce_card_from_blacklist(self,card_hash)->None:
        self.r.srem(self.BLACKLIST_KEY,card_hash)

    def is_card_blacklisted(self,card_hash:str)->bool:
        return bool(self.r.sismember(self.BLACKLIST_KEY,card_hash))

    def evaluate_velocity(self,max_tx:int=5,card_hash:str,window_sec:int=60)->Tuple[bool,int]:
        now=time.time()
        window_start=now-window_sec
        key = f"{self.VELOCITY_KEY_PREFIX}:{card_hash}"
        member_id = f"{now}:{uuid.uuid4().hex[:6]}"
        pipe =self.r.pipeline(transaction=True)
        pipe.zremrangebyscore(key,0,window_start)
        pipe.zadd(key,{member_id:now})
        pipe.zcard(key)
        pipe.expire(key,window_sec+30)
        results=pipe.execute()
        current_velocity=results[2]
        is_allowed=current_velocity<=max_tx
        return is_allowed,current_velocity
    def inspect_transaction(self,card_hash:str,)->FraudEvaluation:
        start_time=time.perf_counter()
        if self.is_card_blacklisted(card_hash):


