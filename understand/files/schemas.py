from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
STATUS_PATTERN = r"^(in transit|delivered|pending|processing)$"
class ShipmentRead(BaseModel):
    """What we send back to the client. Includes server-controlled fields like id."""

    model_config = ConfigDict(from_attributes=True)  # lets this build directly from a ShipmentDB ORM object

    id: int = Field(description="identifier", ge=0)
    weight: float = Field(description="Weight of shipment in kg", examples=[23.5], le=50.0, gt=1.00)
    content: str = Field(description="Content of the shipment", examples=["electronics"], min_length=6, max_length=20)
    status: str = Field(description="Current status of the shipment", examples=["in transit"], pattern=STATUS_PATTERN)


class ShipmentCreate(BaseModel):
    """What the client sends to create a shipment. No id, no status — server decides those."""

    weight: float = Field(description="Weight of shipment in kg", examples=[23.5], le=50.0, gt=1.00)
    content: str = Field(description="Content of the shipment", examples=["electronics"], min_length=6, max_length=20)


class ShipmentReplace(BaseModel):
    """Used for PUT — full replacement, so every field is required."""

    weight: float = Field(description="Weight of shipment in kg", examples=[23.5], le=50.0, gt=1.00)
    content: str = Field(description="Content of the shipment", examples=["electronics"], min_length=6, max_length=20)
    status: str = Field(description="Current status of the shipment", examples=["in transit"], pattern=STATUS_PATTERN)


class ShipmentUpdate(BaseModel):
    """Used for PATCH — partial update, so every field is optional with a real default."""

    weight: Optional[float] = Field(default=None, description="Weight of shipment in kg", le=50.0, gt=1.00)
    content: Optional[str] = Field(default=None, description="Content of the shipment", min_length=6, max_length=20)
    status: Optional[str] = Field(default=None, description="Current status of the shipment", pattern=STATUS_PATTERN)
