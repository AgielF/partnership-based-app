from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class DeliverableSubmit(BaseModel):
    submission_link: str
    description: Optional[str] = None

class DeliverableReview(BaseModel):
    status: str  # Wajib diisi 'APPROVED' atau 'REVISION_REQUESTED'
    feedback: Optional[str] = None

class DeliverableResponse(BaseModel):
    id: int
    project_id: str
    title: str
    description: Optional[str]
    submission_link: Optional[str]
    status: str
    feedback: Optional[str]
    updated_at: datetime

    class Config:
        from_attributes = True