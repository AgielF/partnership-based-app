from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from app.core.database import get_db
from app.models import domain_models as models
from app.schemas import response_schemas as schemas
from decimal import Decimal
from datetime import datetime

import os
import shutil
import uuid

router = APIRouter(prefix="/api/mitra", tags=["Mitra"])

# ==========================================
# SKEMA PYDANTIC (INPUT VALIDATION)
# ==========================================
class TakeJobRequest(BaseModel):
    mitra_id: str

class ReviewRequest(BaseModel):
    rating: int

class ProfileUpdateRequest(BaseModel):
    specialty_role: str
    hourly_rate_or_fee: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None

# Tambahkan di bagian atas file bersama skema lain
class ProgressUpdate(BaseModel):
    mitra_id: str
    milestone_text: str

# ==========================================
# BURSA KERJA (JOBS)
# ==========================================
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

# ==========================================
# PENGAMBILAN PROYEK & MASA PERCOBAAN
# ==========================================
MAX_PROBATION_BUDGET = 1000000.00  # Rp 1.000.000

@router.post("/jobs/{project_id}/take")
def take_project(project_id: str, payload: TakeJobRequest, db: Session = Depends(get_db)):
    mitra_id = payload.mitra_id
    
    mitra_prof = db.query(models.MitraProfile).filter(models.MitraProfile.user_id == mitra_id).first()
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    
    if not mitra_prof or not project:
        raise HTTPException(status_code=404, detail="Data tidak ditemukan.")
    
    # Cek kepatuhan KYC
    if mitra_prof.kyc_status == "BANNED":
        raise HTTPException(status_code=403, detail="AKSES DITOLAK: Akun Anda telah diblokir permanen.")
    elif mitra_prof.kyc_status != "VERIFIED":
         raise HTTPException(status_code=403, detail="AKSES DITOLAK: Akun Anda belum diverifikasi oleh Admin.")

    if project.status != "OPEN":
        raise HTTPException(status_code=400, detail="Proyek sudah tidak tersedia atau telah diambil oleh pihak lain.")

    # Aturan Masa Percobaan (Probation < 10 Proyek)
    if mitra_prof.projects_completed < 10:
        active_job_count = db.query(models.Project).filter(
            models.Project.mitra_id == mitra_id,
            models.Project.status.in_(["SEDANG DIKERJAKAN", "MENUNGGU UAT", "DISPUTED"])
        ).count()
        
        if active_job_count >= 1:
            raise HTTPException(
                status_code=400, 
                detail=f"BATAS KUOTA AKTIF: Karena Anda belum menyelesaikan 10 proyek (Saat ini: {mitra_prof.projects_completed}), Anda hanya diizinkan mengerjakan 1 proyek dalam satu waktu."
            )
        
        if mitra_prof.projects_completed == 0 and float(project.budget) > MAX_PROBATION_BUDGET:
            raise HTTPException(
                status_code=400, 
                detail=f"BATAS BUDGET PERCOBAAN: Untuk proyek pertama Anda, dilarang mengambil kontrak dengan nilai di atas Rp {MAX_PROBATION_BUDGET:,.0f}."
            )

    # Eksekusi Assignment
    project.mitra_id = mitra_id
    project.status = "SEDANG DIKERJAKAN"
    project.current_milestone = "Kontrak disetujui. Menunggu pengerjaan teknis oleh mitra."
    
    db.commit()
    return {"status": "success", "message": "Proyek berhasil diambil. Selamat bekerja!"}

@router.post("/projects/{project_id}/review")
def submit_project_review(project_id: str, payload: ReviewRequest, db: Session = Depends(get_db)):
    rating = payload.rating
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Proyek tidak ditemukan.")
        
    mitra_prof = db.query(models.MitraProfile).filter(models.MitraProfile.user_id == project.mitra_id).first()
    
    if mitra_prof:
        # Auto-Ban Seleksi Alam
        if mitra_prof.projects_completed < 10 and rating == 1:
            mitra_prof.kyc_status = "BANNED"
            project.current_milestone = "SISTEM BLACKLIST: Mitra di-banned karena performa sangat buruk di masa percobaan."
            db.commit()
            raise HTTPException(
                status_code=403, 
                detail="SISTEM PERINGATAN KEPATUHAN: Akun mitra otomatis dibanned karena mendapatkan rating bintang 1 pada masa probation."
            )
            
        if rating > 1:
            mitra_prof.projects_completed += 1
            current_total_score = float(mitra_prof.rating) * (mitra_prof.projects_completed - 1)
            mitra_prof.rating = Decimal(str(round((current_total_score + rating) / mitra_prof.projects_completed, 2)))
            
    db.commit()
    return {"status": "success", "message": "Ulasan berhasil disimpan."}

# ==========================================
# DASHBOARD & PROYEK MITRA
# ==========================================
@router.get("/{mitra_id}/projects")
def get_mitra_projects(mitra_id: str, db: Session = Depends(get_db)):
    projects = db.query(models.Project).filter(models.Project.mitra_id == mitra_id).all()
    
    result = []
    for p in projects:
        result.append({
            "id": p.id,
            "title": p.title,
            "status": p.status,
            "client_id": p.client_id,
            "budget": float(p.budget),
            "service_type": p.service_type,
            "current_milestone": p.current_milestone,
            "deadline_days": p.deadline_days
        })
    return result

# ==========================================
# DOMPET & TRANSAKSI MITRA
# ==========================================
@router.get("/{mitra_id}/wallet")
def get_mitra_wallet(mitra_id: str, db: Session = Depends(get_db)):
    wallet = db.query(models.Wallet).filter(models.Wallet.user_id == mitra_id).first()
    if not wallet:
        wallet = models.Wallet(user_id=mitra_id, balance=Decimal('0.00'), escrow_balance=Decimal('0.00'))
        db.add(wallet)
        db.commit()

    transactions = db.query(models.Transaction).filter(
        models.Transaction.user_id == mitra_id
    ).order_by(models.Transaction.created_at.desc()).limit(10).all()

    trx_list = []
    for t in transactions:
        trx_list.append({
            "id": t.id,
            "type": t.transaction_type,
            "amount": float(t.amount),
            "status": t.status,
            "date": t.created_at.isoformat() if t.created_at else None
        })

    return {
        "balance": float(wallet.balance),
        "escrow_balance": float(wallet.escrow_balance),
        "transactions": trx_list
    }

# ==========================================
# PROFIL MITRA (BACA & UBAH)
# ==========================================
@router.get("/{mitra_id}/profile")
def get_mitra_profile(mitra_id: str, db: Session = Depends(get_db)):
    profile = db.query(models.MitraProfile).filter(models.MitraProfile.user_id == mitra_id).first()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profil Mitra tidak ditemukan di database.")
    
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
        "longitude": float(profile.longitude) if profile.longitude else None
    }

@router.put("/{mitra_id}/profile")
def update_mitra_profile(mitra_id: str, payload: ProfileUpdateRequest, db: Session = Depends(get_db)):
    profile = db.query(models.MitraProfile).filter(models.MitraProfile.user_id == mitra_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profil Mitra tidak ditemukan.")
    
    # Hanya update kolom yang diizinkan (Non-Sensitif)
    profile.specialty_role = payload.specialty_role
    profile.hourly_rate_or_fee = payload.hourly_rate_or_fee
    
    if payload.latitude is not None and payload.longitude is not None:
        profile.latitude = payload.latitude
        profile.longitude = payload.longitude
        
    db.commit()
    return {"status": "success", "message": "Profil berhasil diperbarui!"}

# ==========================================
# UNGGAH DOKUMEN KYC (KTP)
# ==========================================
UPLOAD_DIR = "uploads/ktp"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/{mitra_id}/upload-ktp")
async def upload_ktp(mitra_id: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    mitra_prof = db.query(models.MitraProfile).filter(models.MitraProfile.user_id == mitra_id).first()
    if not mitra_prof:
        raise HTTPException(status_code=404, detail="Profil Mitra tidak ditemukan.")

    if file.content_type not in ["image/jpeg", "image/png"]:
        raise HTTPException(status_code=400, detail="Format file tidak didukung. Gunakan JPG atau PNG.")

    file_extension = file.filename.split(".")[-1]
    secure_filename = f"{mitra_id}_{uuid.uuid4().hex[:8]}.{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, secure_filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Catatan: Asumsikan ktp_image_url belum ada di model MySQL saat ini.
    # Kita hanya mengubah state KYC.
    mitra_prof.kyc_status = "PENDING"
    
    db.commit()
    
    return {"status": "success", "message": "KTP berhasil diunggah. Menunggu verifikasi Admin."}

# ==========================================
# E-CONTRACT / PERSETUJUAN MITRA
# ==========================================
@router.put("/projects/{project_id}/sign")
def sign_mitra_contract(project_id: str, mitra_id: str, db: Session = Depends(get_db)):
    # 1. Pastikan proyek ini benar-benar milik Mitra yang sedang login
    project = db.query(models.Project).filter(
        models.Project.id == project_id,
        models.Project.mitra_id == mitra_id
    ).first()

    if not project:
        raise HTTPException(status_code=404, detail="Proyek atau kontrak tidak ditemukan.")

    # 2. Cegah modifikasi jika proyek sudah selesai/batal
    if project.status in ["COMPLETED", "CANCELLED"]:
        raise HTTPException(status_code=400, detail="Kontrak sudah kedaluwarsa atau tidak bisa ditandatangani.")

    # 3. Catat jejak audit digital ke dalam milestone
    project.current_milestone = f"Kontrak disetujui Mitra via Click-Wrap pada {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} WIB."

    db.commit()
    return {"status": "success", "message": "Click-Wrap Agreement berhasil disahkan secara hukum oleh Mitra."}

# Tambahkan di bawah endpoint /sign (di bagian E-CONTRACT)
@router.put("/projects/{project_id}/progress")
def update_project_progress(project_id: str, payload: ProgressUpdate, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(
        models.Project.id == project_id,
        models.Project.mitra_id == payload.mitra_id
    ).first()

    if not project:
        raise HTTPException(status_code=404, detail="Proyek tidak ditemukan.")

    if project.status in ["COMPLETED", "CANCELLED"]:
        raise HTTPException(status_code=400, detail="Proyek sudah ditutup, tidak bisa mengubah progres.")

    # Update teks jejak audit
    project.current_milestone = f"[{datetime.now().strftime('%d/%m %H:%M')}] {payload.milestone_text}"

    # Auto-escalate jika Mitra menyatakan selesai / minta UAT
    if "UAT" in payload.milestone_text.upper() or "SELESAI" in payload.milestone_text.upper():
        project.status = "MENUNGGU UAT"

    db.commit()
    return {"status": "success", "message": "Progres pekerjaan berhasil diperbarui!"}