from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models import domain_models as models
from app.schemas import response_schemas as schemas

router = APIRouter(prefix="/api/mitra", tags=["Mitra"])

@router.get("/jobs", response_model=List[schemas.JobListing])
def get_available_jobs(db: Session = Depends(get_db)):
    open_projects = db.query(models.Project).filter(models.Project.status == 'OPEN').all()
    
    result = []
    for proj in open_projects:
        tags = [tag.tag_name for tag in proj.tags]
        budget_formatted = f"Rp {proj.budget:,.0f}".replace(",", ".")
        deadline_formatted = f"{proj.deadline_days} HARI" if proj.deadline_days else "TIDAK DITENTUKAN"
        
        result.append({
            "id": proj.id,
            "title": proj.title,
            "client": proj.client.name if proj.client else "Klien Anonim",
            "tags": tags,
            "type": proj.service_type,
            "budget": budget_formatted,
            "deadline": deadline_formatted,
            "description": proj.description or ""
        })
    return result
