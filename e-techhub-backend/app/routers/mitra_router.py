import os
import shutil
import uuid
from decimal import Decimal
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import domain_models as models
from app.schemas import response_schemas as schemas
from app.routers.notification_router import notif_manager

router = APIRouter(prefix="/api/mitra", tags=["Mitra"])

# =========================================================================
# SKEMA PYDANTIC
# =========================================================================
class TakeJobRequest(BaseModel):
    mitra_id: str

class ReviewRequest(BaseModel):
    rating: int

class ProgressUpdate(BaseModel):
    mitra_id: str
    milestone_text: str

class ClientPublicProfile(BaseModel):
    id: str
    name_masked: str
    is_payment_verified: bool
    total_projects_posted: int

class DeliverableSubmitPayload(BaseModel):
    submission_link: str
    description: Optional[str] = None

class QnASubmitPayload(BaseModel):
    user_id: str
    message: str

class BidSubmitPayload(BaseModel):
    mitra_id: str
    bid_amount: float
    cover_letter: str

# Skema Profile Update yang sudah disatukan dan lengkap
class ProfileUpdateRequest(BaseModel):
    specialty_role: str
    hourly_rate_or_fee: str
    portfolio_link: Optional[str] = None  # <-- Tambahan baru
    avatar_url: Optional[str] = None      # <-- Tambahan baru
    latitude: Optional[float] = None
    longitude: Optional[float] = None

# =========================================================================
# PAPAN DISKUSI TERBUKA (Q&A)
# =========================================================================
@router.get("/projects/{project_id}/qna")
def get_project_qna(project_id: str, db: Session = Depends(get_db)):
    qna_list = db.query(models.ProjectQnA).filter(models.ProjectQnA.project_id == project_id).order_by(models.ProjectQnA.created_at.asc()).all()
    result = []
    for qna in qna_list:
        is_client = qna.user.role == 'klien'
        name_display = f"{qna.user.name} (KLIEN/PEMILIK)" if is_client else f"Mitra: {qna.user.name}"
        result.append({
            "id": qna.id, "user_id": qna.user_id, "name": name_display,
            "is_client": is_client, "message": qna.message,
            "timestamp": qna.created_at.strftime('%d/%m %H:%M')
        })
    return result

@router.post("/projects/{project_id}/qna")
async def submit_project_qna(project_id: str, payload: QnASubmitPayload, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project: raise HTTPException(status_code=404, detail="Proyek tidak ditemukan.")
        
    new_qna = models.ProjectQnA(project_id=project_id, user_id=payload.user_id, message=payload.message)
    db.add(new_qna)
    db.commit()

    if payload.user_id != project.client_id:
        await notif_manager.send_personal_notification(
            user_id=project.client_id, title="❓ PERTANYAAN BARU Q&A",
            message=f"Ada pertanyaan masuk untuk proyek: '{project.title}'.", db=db
        )
    return {"status": "success"}

# =========================================================================
# PROFIL PUBLIK KLIEN & RIWAYAT PROYEKNYA
# =========================================================================
@router.get("/clients/{client_id}/public", response_model=ClientPublicProfile)
def get_client_public_profile(client_id: str, db: Session = Depends(get_db)):
    client_data = db.query(models.User).filter(models.User.id == client_id, models.User.role == 'klien').first()
    if not client_data: raise HTTPException(status_code=404)
    has_wallet_balance = db.query(models.Wallet).filter(models.Wallet.user_id == client_id, models.Wallet.balance > 0).first()
    projects_count = db.query(models.Project).filter(models.Project.client_id == client_id).count()
    return {
        "id": client_data.id,
        "name_masked": f"{client_data.name.strip().split()[0]} ***" if client_data.name else "Klien Rahasia",
        "is_payment_verified": True if has_wallet_balance else False,
        "total_projects_posted": projects_count
    }

@router.get("/clients/{client_id}/projects")
def get_client_projects_history(client_id: str, db: Session = Depends(get_db)):
    projects = db.query(models.Project).filter(models.Project.client_id == client_id).order_by(models.Project.id.desc()).all()
    result = []
    for p in projects:
        result.append({
            "id": p.id, "title": p.title, "status": p.status, "service_type": p.service_type,
            "budget": float(p.budget),
            "created_at": p.created_at.strftime("%d %b %Y") if hasattr(p, 'created_at') and p.created_at else "Tidak Diketahui"
        })
    return result

# =========================================================================
# BURSA KERJA & PENGAMBILAN PROYEK
# =========================================================================
@router.get("/jobs", response_model=List[schemas.JobListing])
def get_available_jobs(db: Session = Depends(get_db)):
    open_projects = db.query(models.Project).filter(models.Project.status == 'OPEN').all()
    result = []
    for proj in open_projects:
        result.append({
            "id": proj.id, "title": proj.title, "client_id": proj.client_id,
            "client": proj.client.name if proj.client else "Klien Anonim",
            "tags": [tag.tag_name for tag in proj.tags], "type": proj.service_type,
            "budget": f"Rp {proj.budget:,.0f}".replace(",", "."),
            "deadline": f"{proj.deadline_days} HARI" if proj.deadline_days else "TIDAK DITENTUKAN",
            "description": proj.description or ""
        })
    return result

@router.post("/jobs/{project_id}/take")
def take_project(project_id: str, payload: TakeJobRequest, db: Session = Depends(get_db)):
    mitra_prof = db.query(models.MitraProfile).filter(models.MitraProfile.user_id == payload.mitra_id).first()
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    
    if not mitra_prof or not project: raise HTTPException(status_code=404)
    if mitra_prof.kyc_status == "BANNED": raise HTTPException(status_code=403, detail="AKSES DITOLAK: Akun diblokir.")
    if mitra_prof.kyc_status != "VERIFIED": raise HTTPException(status_code=403, detail="AKSES DITOLAK: Akun belum terverifikasi.")
    if project.status != "OPEN": raise HTTPException(status_code=400, detail="Proyek tidak tersedia.")

    if mitra_prof.projects_completed < 10:
        active_job_count = db.query(models.Project).filter(
            models.Project.mitra_id == payload.mitra_id,
            models.Project.status.in_(["SEDANG DIKERJAKAN", "MENUNGGU UAT", "DISPUTED"])
        ).count()
        if active_job_count >= 1: raise HTTPException(status_code=400, detail="BATAS KUOTA AKTIF PROBATION.")
        if mitra_prof.projects_completed == 0 and float(project.budget) > 1000000.00:
            raise HTTPException(status_code=400, detail="BATAS BUDGET PERCOBAAN.")

    project.mitra_id = payload.mitra_id
    project.status = "SEDANG DIKERJAKAN"
    project.current_milestone = "Kontrak aktif. Milestone pengerjaan resmi diterbitkan."

    default_milestones = [
        {"title": "Tahap 1: Desain", "desc": "Penyerahan rancangan."},
        {"title": "Tahap 2: Implementasi", "desc": "Pengembangan sistem."},
        {"title": "Tahap 3: Akhir", "desc": "Penyelesaian."}
    ]
    for m in default_milestones:
        db.add(models.ProjectDeliverable(project_id=project_id, title=m["title"], description=m["desc"], status="PENDING"))
    db.commit()
    return {"status": "success"}

# =========================================================================
# DASHBOARD, WALLET, PROFIL, DAN PORTOFOLIO
# =========================================================================
@router.get("/{mitra_id}/history")
def get_mitra_history(mitra_id: str, db: Session = Depends(get_db)):
    projects = db.query(models.Project).filter(models.Project.mitra_id == mitra_id, models.Project.status == "COMPLETED").order_by(models.Project.id.desc()).all()
    result = []
    for p in projects:
        result.append({
            "id": p.id, "title": p.title, "service_type": p.service_type, "budget": float(p.budget),
            "client_name": p.client.name if p.client else "Anonim",
            "mitra_name": p.mitra.name if p.mitra else "Anonim",
            "milestone_akhir": p.current_milestone
        })
    return result

@router.get("/{mitra_id}/wallet")
def get_mitra_wallet(mitra_id: str, db: Session = Depends(get_db)):
    wallet = db.query(models.Wallet).filter(models.Wallet.user_id == mitra_id).first()
    if not wallet:
        wallet = models.Wallet(user_id=mitra_id, balance=Decimal('0.00'), escrow_balance=Decimal('0.00'))
        db.add(wallet)
        db.commit()
    transactions = db.query(models.Transaction).filter(models.Transaction.user_id == mitra_id).order_by(models.Transaction.created_at.desc()).limit(10).all()
    trx_list = [{"id": t.id, "type": t.transaction_type, "amount": float(t.amount), "status": t.status, "date": t.created_at.isoformat() if t.created_at else None} for t in transactions]
    return {"balance": float(wallet.balance), "escrow_balance": float(wallet.escrow_balance), "transactions": trx_list}

@router.get("/{mitra_id}/profile")
def get_mitra_profile(mitra_id: str, db: Session = Depends(get_db)):
    profile = db.query(models.MitraProfile).filter(models.MitraProfile.user_id == mitra_id).first()
    if not profile: raise HTTPException(status_code=404)
    
    active_count = db.query(models.Project).filter(
        models.Project.mitra_id == mitra_id, 
        models.Project.status.in_(["SEDANG DIKERJAKAN", "MENUNGGU UAT", "DISPUTED"])
    ).count()
    
    return {
        "user_id": profile.user_id, 
        "kyc_status": profile.kyc_status, 
        "projects_completed": profile.projects_completed,
        "active_projects": active_count, 
        "rating": float(profile.rating), 
        "specialty_role": profile.specialty_role,
        "hourly_rate_or_fee": profile.hourly_rate_or_fee or "",
        "latitude": float(profile.latitude) if profile.latitude else None, 
        "longitude": float(profile.longitude) if profile.longitude else None,
        
        # Data untuk Foto dan Portofolio dikirimkan ke frontend
        "avatar_url": profile.avatar_url or "",
        "portfolio_link": profile.portfolio_link or ""
    }

@router.put("/{mitra_id}/profile")
def update_mitra_profile(mitra_id: str, payload: ProfileUpdateRequest, db: Session = Depends(get_db)):
    profile = db.query(models.MitraProfile).filter(models.MitraProfile.user_id == mitra_id).first()
    if not profile: raise HTTPException(status_code=404)
    
    # 1. Update data dasar
    profile.specialty_role = payload.specialty_role
    profile.hourly_rate_or_fee = payload.hourly_rate_or_fee
    
    # 2. Update koordinat GPS
    if payload.latitude is not None and payload.longitude is not None:
        profile.latitude = payload.latitude
        profile.longitude = payload.longitude

    # 3. Update Foto & Portofolio (Fungsi yang sebelumnya terlewat)
    if payload.avatar_url is not None:
        profile.avatar_url = payload.avatar_url
        
    if payload.portfolio_link is not None:
        profile.portfolio_link = payload.portfolio_link
        
    db.commit()
    return {"status": "success"}

@router.get("/{mitra_id}/projects")
def get_mitra_projects(mitra_id: str, db: Session = Depends(get_db)):
    projects = db.query(models.Project).filter(models.Project.mitra_id == mitra_id).all()
    return [{"id": p.id, "title": p.title, "status": p.status, "client_id": p.client_id, "budget": float(p.budget), "service_type": p.service_type, "current_milestone": p.current_milestone, "deadline_days": p.deadline_days} for p in projects]

# =========================================================================
# SISTEM PENAWARAN (BIDDING) - SISI MITRA
# =========================================================================
@router.post("/jobs/{project_id}/bid")
async def submit_project_bid(project_id: str, payload: BidSubmitPayload, db: Session = Depends(get_db)):
    """Mitra mengirimkan proposal penawaran (harga & surat) ke sebuah proyek Publik"""
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project or project.status != "OPEN":
        raise HTTPException(status_code=400, detail="Proyek tidak tersedia atau sudah ditutup.")
        
    existing_bid = db.query(models.ProjectBid).filter(
        models.ProjectBid.project_id == project_id,
        models.ProjectBid.mitra_id == payload.mitra_id
    ).first()
    if existing_bid:
        raise HTTPException(status_code=400, detail="Anda sudah mengirimkan penawaran untuk proyek ini.")

    new_bid = models.ProjectBid(
        id=f"BID-{uuid.uuid4().hex[:6].upper()}",
        project_id=project_id,
        mitra_id=payload.mitra_id,
        bid_amount=payload.bid_amount,
        cover_letter=payload.cover_letter
    )
    db.add(new_bid)
    db.commit()

    await notif_manager.send_personal_notification(
        user_id=project.client_id,
        title="🎯 PENAWARAN BARU MASUK",
        message=f"Ada penawaran masuk sebesar Rp {payload.bid_amount:,.0f} untuk proyek '{project.title}'.",
        db=db
    )
    return {"status": "success", "message": "Proposal berhasil dikirim!"}

# =========================================================================
# OPERASIONAL DOKUMEN & DELIVERABLES
# =========================================================================
UPLOAD_DIR = "uploads/ktp"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/{mitra_id}/upload-ktp")
async def upload_ktp(mitra_id: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    mitra_prof = db.query(models.MitraProfile).filter(models.MitraProfile.user_id == mitra_id).first()
    if file.content_type not in ["image/jpeg", "image/png"]: raise HTTPException(status_code=400)
    secure_filename = f"{mitra_id}_{uuid.uuid4().hex[:8]}.{file.filename.split('.')[-1]}"
    with open(os.path.join(UPLOAD_DIR, secure_filename), "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    mitra_prof.kyc_status = "PENDING"
    db.commit()
    return {"status": "success"}

@router.put("/projects/{project_id}/sign")
def sign_mitra_contract(project_id: str, mitra_id: str, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id, models.Project.mitra_id == mitra_id).first()
    if not project or project.status in ["COMPLETED", "CANCELLED"]: raise HTTPException(status_code=400)
    project.current_milestone = f"Kontrak disetujui Mitra via Click-Wrap pada {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}."
    db.commit()
    return {"status": "success"}

@router.put("/projects/{project_id}/progress")
def update_project_progress(project_id: str, payload: ProgressUpdate, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id, models.Project.mitra_id == payload.mitra_id).first()
    if not project or project.status in ["COMPLETED", "CANCELLED"]: raise HTTPException(status_code=400)
    project.current_milestone = f"[{datetime.now().strftime('%d/%m %H:%M')}] {payload.milestone_text}"
    if "UAT" in payload.milestone_text.upper() or "SELESAI" in payload.milestone_text.upper():
        project.status = "MENUNGGU UAT"
    db.commit()
    return {"status": "success"}

@router.get("/projects/{project_id}/deliverables")
def get_mitra_project_deliverables(project_id: str, db: Session = Depends(get_db)):
    return db.query(models.ProjectDeliverable).filter(models.ProjectDeliverable.project_id == project_id).order_by(models.ProjectDeliverable.id.asc()).all()

@router.put("/projects/{project_id}/deliverables/{deliverable_id}/submit")
async def submit_milestone_work(project_id: str, deliverable_id: int, payload: DeliverableSubmitPayload, db: Session = Depends(get_db)):
    deliverable = db.query(models.ProjectDeliverable).filter(models.ProjectDeliverable.id == deliverable_id, models.ProjectDeliverable.project_id == project_id).first()
    if not deliverable or deliverable.status == "APPROVED": raise HTTPException(status_code=400)
    deliverable.submission_link = payload.submission_link
    if payload.description: deliverable.description = payload.description
    deliverable.status = "SUBMITTED"
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if project:
        project.current_milestone = f"[{datetime.now().strftime('%d/%m %H:%M')}] Mitra menyetor: {deliverable.title}"
        if "Tahap 3" in deliverable.title: project.status = "MENUNGGU UAT"
        db.commit()
        await notif_manager.send_personal_notification(
            user_id=project.client_id, title="📈 BUKTI KERJA",
            message=f"Mitra mengirimkan artefak '{deliverable.title}'.", db=db
        )
    else:
        db.commit()
    return {"status": "success", "data": deliverable}

# Buat direktori khusus avatar jika belum ada
AVATAR_DIR = "uploads/avatars"
os.makedirs(AVATAR_DIR, exist_ok=True)

@router.post("/{mitra_id}/upload-avatar")
async def upload_mitra_avatar(mitra_id: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    # 1. Validasi Ekstensi Gambar
    if file.content_type not in ["image/jpeg", "image/png", "image/webp"]:
        raise HTTPException(status_code=400, detail="Format file harus JPG, PNG, atau WEBP")

    # 2. Buat Nama File Unik (Contoh: avatar_VND-123_a1b2c3d4.jpg)
    file_extension = file.filename.split('.')[-1]
    secure_filename = f"avatar_{mitra_id}_{uuid.uuid4().hex[:8]}.{file_extension}"
    file_path = os.path.join(AVATAR_DIR, secure_filename)

    # 3. Simpan File Secara Fisik ke Hardisk Server
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # 4. Susun URL Akses Publik (Sesuaikan IP dengan konfigurasi Anda)
    # Jika server berjalan di 192.168.110.187, kembalikan URL tersebut
    public_url = f"http://127.0.0.1:8000/uploads/avatars/{secure_filename}"

    return {"status": "success", "url": public_url}