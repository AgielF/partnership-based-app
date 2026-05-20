from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from app.core.database import get_db
from app.models import domain_models as models
from app.schemas import response_schemas as schemas
from decimal import Decimal
from datetime import datetime
from app.routers.notification_router import notif_manager # <-- IMPORT NOTIFICATION ENGINE GLOBAL

import os
import shutil
import uuid

router = APIRouter(prefix="/api/mitra", tags=["Mitra"])

# =========================================================================
# SKEMA PYDANTIC (INPUT VALIDATION)
# =========================================================================
class TakeJobRequest(BaseModel):
    mitra_id: str

class ReviewRequest(BaseModel):
    rating: int

class ProfileUpdateRequest(BaseModel):
    specialty_role: str
    hourly_rate_or_fee: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None

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

# =========================================================================
# PAPAN DISKUSI TERBUKA / FORUM Q&A (GAYA FREELANCER.COM)
# =========================================================================
@router.get("/projects/{project_id}/qna")
def get_project_qna(project_id: str, db: Session = Depends(get_db)):
    """Mengambil seluruh riwayat diskusi publik untuk papan proyek tertentu"""
    qna_list = db.query(models.ProjectQnA).filter(
        models.ProjectQnA.project_id == project_id
    ).order_by(models.ProjectQnA.created_at.asc()).all()
    
    result = []
    for qna in qna_list:
        # Menyamarkan nama jika role-nya adalah klien/pemilik proyek asli
        is_client = qna.user.role == 'klien'
        name_display = f"{qna.user.name} (KLIEN/PEMILIK)" if is_client else f"Mitra: {qna.user.name}"
        
        result.append({
            "id": qna.id,
            "user_id": qna.user_id,
            "name": name_display,
            "is_client": is_client,
            "message": qna.message,
            "timestamp": qna.created_at.strftime('%d/%m %H:%M')
        })
    return result

@router.post("/projects/{project_id}/qna")
async def submit_project_qna(project_id: str, payload: QnASubmitPayload, db: Session = Depends(get_db)):
    """Memposting pertanyaan/jawaban publik sekaligus memicu alert real-time ke Klien"""
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proyek tidak ditemukan.")
        
    new_qna = models.ProjectQnA(
        project_id=project_id,
        user_id=payload.user_id,
        message=payload.message
    )
    db.add(new_qna)
    db.commit()

    # TRIGGER REAL-TIME NOTIFIKASI: Beri tahu Klien jika ada Mitra yang mengirim pertanyaan/respons baru
    if payload.user_id != project.client_id:
        await notif_manager.send_personal_notification(
            user_id=project.client_id,
            title="❓ PERTANYAAN BARU DI PAPAN Q&A",
            message=f"Ada tanggapan/pertanyaan masuk untuk proyek Anda: '{project.title}'.",
            db=db
        )
        
    return {"status": "success", "message": "Pesan berhasil dipublikasikan ke papan Q&A publik."}

# =========================================================================
# PROFIL PUBLIK KLIEN (AKSES OLEH MITRA DENGAN SYNC SYNTAX 'klien')
# =========================================================================
@router.get("/clients/{client_id}/public", response_model=ClientPublicProfile)
def get_client_public_profile(client_id: str, db: Session = Depends(get_db)):
    client_data = db.query(models.User).filter(
        models.User.id == client_id, 
        models.User.role == 'klien'  # Cocok secara presisi dengan dump data MySQL lokal Anda
    ).first()
    
    if not client_data:
        raise HTTPException(status_code=404, detail="Klien tidak ditemukan di database")

    has_wallet_balance = db.query(models.Wallet).filter(models.Wallet.user_id == client_id, models.Wallet.balance > 0).first()
    projects_count = db.query(models.Project).filter(models.Project.client_id == client_id).count()

    def mask_client_name(name: str) -> str:
        parts = name.strip().split()
        return f"{parts[0]} ***" if len(parts) > 0 else "Klien Rahasia"

    return {
        "id": client_data.id,
        "name_masked": mask_client_name(client_data.name),
        "is_payment_verified": True if has_wallet_balance else False,
        "total_projects_posted": projects_count
    }

# =========================================================================
# BURSA KERJA (JOBS LISTING)
# =========================================================================
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
            "client_id": proj.client_id, # Lolos verifikasi schema aman ke frontend
            "client": proj.client.name if proj.client else "Klien Anonim",
            "tags": tags,
            "type": proj.service_type,
            "budget": budget_formatted,
            "deadline": deadline_formatted,
            "description": proj.description or ""
        })
    return result

# =========================================================================
# PENGAMBILAN PROYEK & GENERASI OTOMATIS MILESTONE
# =========================================================================
MAX_PROBATION_BUDGET = 1000000.00  # Rp 1.000.000

@router.post("/jobs/{project_id}/take")
def take_project(project_id: str, payload: TakeJobRequest, db: Session = Depends(get_db)):
    mitra_id = payload.mitra_id
    
    mitra_prof = db.query(models.MitraProfile).filter(models.MitraProfile.user_id == mitra_id).first()
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    
    if not mitra_prof or not project:
        raise HTTPException(status_code=404, detail="Data tidak ditemukan.")
    
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
                detail=f"BATAS KUOTA AKTIF: Anda hanya diizinkan mengerjakan 1 proyek dalam satu waktu pada masa percobaan."
            )
        
        if mitra_prof.projects_completed == 0 and float(project.budget) > MAX_PROBATION_BUDGET:
            raise HTTPException(
                status_code=400, 
                detail=f"BATAS BUDGET PERCOBAAN: Maksimal nilai proyek pertama Anda adalah Rp {MAX_PROBATION_BUDGET:,.0f}."
            )

    # Eksekusi Penetapan Kerja (Assignment)
    project.mitra_id = mitra_id
    project.status = "SEDANG DIKERJAKAN"
    project.current_milestone = "Kontrak aktif. Milestone pengerjaan resmi diterbitkan."

    # -------------------------------------------------------------------------
    # SEEDING AUTOMATION: Bangun 3 Lini Masa Kerja Otomatis (Standar Dokumen Industri)
    # -------------------------------------------------------------------------
    default_milestones = [
        {"title": "Tahap 1: Desain & Arsitektur", "desc": "Penyerahan mock-up UI/UX atau skema rancangan IoT hardware."},
        {"title": "Tahap 2: Implementasi Sistem", "desc": "Pengembangan fungsionalitas inti, integrasi API, atau perakitan hardware."},
        {"title": "Tahap 3: Hasil Akhir & Dokumentasi", "desc": "Penyelesaian source code akhir, pengujian sistem, atau drop-off perangkat fisik."}
    ]
    
    for milestone in default_milestones:
        new_deliverable = models.ProjectDeliverable(
            project_id=project_id,
            title=milestone["title"],
            description=milestone["desc"],
            status="PENDING"
        )
        db.add(new_deliverable)
    
    db.commit()
    return {"status": "success", "message": "Proyek berhasil diambil. Rencana kerja resmi dibuat!"}

# =========================================================================
# DASHBOARD & ULASAN PERFORMA
# =========================================================================
@router.post("/projects/{project_id}/review")
def submit_project_review(project_id: str, payload: ReviewRequest, db: Session = Depends(get_db)):
    rating = payload.rating
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Proyek tidak ditemukan.")
        
    mitra_prof = db.query(models.MitraProfile).filter(models.MitraProfile.user_id == project.mitra_id).first()
    
    if mitra_prof:
        if mitra_prof.projects_completed < 10 and rating == 1:
            mitra_prof.kyc_status = "BANNED"
            project.current_milestone = "SISTEM BLACKLIST: Mitra di-banned karena performa buruk di masa percobaan."
            db.commit()
            raise HTTPException(
                status_code=403, 
                detail="SISTEM PERINGATAN KEPATUHAN: Akun mitra otomatis dibanned karena rating bintang 1 pada masa probation."
            )
            
        if rating > 1:
            mitra_prof.projects_completed += 1
            current_total_score = float(mitra_prof.rating) * (mitra_prof.projects_completed - 1)
            mitra_prof.rating = Decimal(str(round((current_total_score + rating) / mitra_prof.projects_completed, 2)))
            
    db.commit()
    return {"status": "success", "message": "Ulasan berhasil disimpan."}

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

# =========================================================================
# DOMPET & PROFIL MITRA
# =========================================================================
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
    
    profile.specialty_role = payload.specialty_role
    profile.hourly_rate_or_fee = payload.hourly_rate_or_fee
    
    if payload.latitude is not None and payload.longitude is not None:
        profile.latitude = payload.latitude
        profile.longitude = payload.longitude
        
    db.commit()
    return {"status": "success", "message": "Profil berhasil diperbarui!"}

# =========================================================================
# OPERASIONAL DOKUMEN (KYC & SPK SIGNATURE)
# =========================================================================
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

    mitra_prof.kyc_status = "PENDING"
    db.commit()
    return {"status": "success", "message": "KTP berhasil diunggah. Menunggu verifikasi Admin."}

@router.put("/projects/{project_id}/sign")
def sign_mitra_contract(project_id: str, mitra_id: str, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(
        models.Project.id == project_id,
        models.Project.mitra_id == mitra_id
    ).first()

    if not project:
        raise HTTPException(status_code=404, detail="Proyek atau kontrak tidak ditemukan.")

    if project.status in ["COMPLETED", "CANCELLED"]:
        raise HTTPException(status_code=400, detail="Kontrak sudah kedaluwarsa.")

    project.current_milestone = f"Kontrak disetujui Mitra via Click-Wrap pada {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} WIB."
    db.commit()
    return {"status": "success", "message": "Click-Wrap Agreement berhasil disahkan secara hukum oleh Mitra."}

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

    project.current_milestone = f"[{datetime.now().strftime('%d/%m %H:%M')}] {payload.milestone_text}"

    if "UAT" in payload.milestone_text.upper() or "SELESAI" in payload.milestone_text.upper():
        project.status = "MENUNGGU UAT"

    db.commit()
    return {"status": "success", "message": "Progres pekerjaan berhasil diperbarui!"}

# =========================================================================
# REKAYASA PENYERAHAN INTEGRASI BUKTI KERJA (WORKSPACE BUKTI KERJA)
# =========================================================================
@router.get("/projects/{project_id}/deliverables")
def get_mitra_project_deliverables(project_id: str, db: Session = Depends(get_db)):
    """Menarik seluruh daftar checklist penyerahan artefak kerja milik Mitra"""
    deliverables = db.query(models.ProjectDeliverable).filter(
        models.ProjectDeliverable.project_id == project_id
    ).order_by(models.ProjectDeliverable.id.asc()).all()
    return deliverables

@router.put("/projects/{project_id}/deliverables/{deliverable_id}/submit")
async def submit_milestone_work(project_id: str, deliverable_id: int, payload: DeliverableSubmitPayload, db: Session = Depends(get_db)):
    """Mitra mengirimkan dokumen spesifikasi/tautan repositori kerja serta menyenggol Klien via WebSocket"""
    deliverable = db.query(models.ProjectDeliverable).filter(
        models.ProjectDeliverable.id == deliverable_id,
        models.ProjectDeliverable.project_id == project_id
    ).first()

    if not deliverable:
        raise HTTPException(status_code=404, detail="Item pengerjaan proyek tidak ditemukan.")
    
    if deliverable.status == "APPROVED":
        raise HTTPException(status_code=400, detail="Tahap pengerjaan ini sudah disetujui oleh Klien.")

    # Mutasi berkas dokumen progres
    deliverable.submission_link = payload.submission_link
    if payload.description:
        deliverable.description = payload.description
    deliverable.status = "SUBMITTED"
    
    # Rekam audit log terpusat ke tabel project utama
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if project:
        project.current_milestone = f"[{datetime.now().strftime('%d/%m %H:%M')}] Mitra menyerahkan bukti: {deliverable.title}"
        
        # Aturan Otomatisasi: Jika yang disetor adalah Tahap 3 (Dokumentasi Akhir), kunci otomatis ke status UAT umum
        check_last_milestone = db.query(models.ProjectDeliverable).filter(
            models.ProjectDeliverable.project_id == project_id,
            models.ProjectDeliverable.title.like("%Tahap 3%")
        ).first()
        if check_last_milestone and check_last_milestone.id == deliverable_id:
            project.status = "MENUNGGU UAT"

        db.commit()

        # -------------------------------------------------------------------------
        # PUSH REAL-TIME PEMBERITAHUAN: Kirim lonceng peringatan langsung ke layar Klien
        # -------------------------------------------------------------------------
        await notif_manager.send_personal_notification(
            user_id=project.client_id,
            title="📈 MITRA MENYERAHKAN BUKTI KERJA",
            message=f"Mitra mengirimkan dokumen/tautan artefak untuk '{deliverable.title}'. Silakan periksa kembali halaman kontrak Anda.",
            db=db
        )
    else:
        db.commit()

    db.refresh(deliverable)
    return {"status": "success", "message": f"Hasil kerja untuk '{deliverable.title}' berhasil dikirim!", "data": deliverable}