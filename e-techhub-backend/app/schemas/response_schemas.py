from pydantic import BaseModel
from typing import List, Optional


class VendorPerformance(BaseModel):
    nama: str
    kecepatanHari: int
    proyekSelesai: int
    rating: float

class ContractDashboard(BaseModel):
    id: str
    title: str
    mitra: str
    type: str
    status: str
    escrow: str
    milestone: str

class JobListing(BaseModel):
    id: str
    title: str
    client_id: Optional[str] = None  # <--- TAMBAHKAN BARIS INI
    client: str
    tags: List[str]
    type: str
    budget: str
    deadline: str
    description: str
