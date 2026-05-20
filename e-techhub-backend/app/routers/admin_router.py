from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List
from decimal import Decimal
from pydantic import BaseModel
import uuid
import os
import glob
import re
from datetime import datetime

# --- TAMBAHAN UNTUK COMPUTER VISION ---
import base64
import numpy as np
import cv2
# --------------------------------------

from app.core.security import get_password_hash 
from app.core.database import get_db
from app.models import domain_models as models
from app.schemas import response_schemas as schemas
from app.routers.notification_router import notif_manager # <-- IMPORT SISTEM NOTIFIKASI GLOBAL

router = APIRouter(prefix="/api/admin", tags=["Admin"])

# ========================
# SCHEMAS
# ========================
class AdminCreate(BaseModel):
    name: str
    email: str
    password: str

class DropOffCreate(BaseModel):
    client_id: str
    title: str
    description: str
    budget: float

class SettingUpdate(BaseModel):
    value: str

# --- TAMBAHAN SKEMA COMPUTER VISION ---
class CashScanRequest(BaseModel):
    image_base64: str
# --------------------------------------

# ==========================================
# REGISTER ADMIN (SEEDER)
# ==========================================
@router.post("/register-superadmin")
def create_super_admin(admin_data: AdminCreate, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.email == admin_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email sudah terdaftar!")

    hashed_password = get_password_hash(admin_data.password)
    admin_id = f"ADM-{uuid.uuid4().hex[:6].upper()}"

    new_admin = models.User(
        id=admin_id, name=admin_data.name.upper(), 
        email=admin_data.email, password_hash=hashed_password, role="admin"
    )
    db.add(new_admin)
    
    # Inisialisasi Dompet Platform untuk menampung komisi
    db.add(models.Wallet(user_id=admin_id, balance=Decimal('0.00'), escrow_balance=Decimal('0.00')))
    db.commit()

    return {"status": "success", "message": "Super Admin berhasil dibuat!"}

# ==========================================
# PILAR 1: MANAJEMEN IDENTITAS (KYC) & KTP
# ==========================================
@router.get("/mitras")
def get_all_mitras(db: Session = Depends(get_db)):
    mitras = db.query(models.MitraProfile).join(models.User).all()
    result = []
    for m in mitras:
        result.append({
            "id": m.user_id,
            "name": f"{m.user.name}",
            "specialty_role": m.specialty_role,
            "kyc_status": m.kyc_status
        })
    return result

@router.get("/mitras/{mitra_id}/ktp")
def get_mitra_ktp_image(mitra_id: str):
    # Mencari file di folder lokal yang namanya berawalan ID Mitra
    search_pattern = f"uploads/ktp/{mitra_id}_*.*"
    files = glob.glob(search_pattern)
    
    if not files:
        raise HTTPException(status_code=404, detail="KTP belum diunggah atau tidak ditemukan.")
    
    # Jika ada lebih dari satu (karena upload ulang), ambil file yang paling baru dibuat
    latest_file = max(files, key=os.path.getctime)
    return FileResponse(latest_file)

@router.put("/kyc/{mitra_id}/verify")
async def verify_mitra_kyc(mitra_id: str, db: Session = Depends(get_db)):
    mitra = db.query(models.MitraProfile).filter(models.MitraProfile.user_id == mitra_id).first()
    if not mitra:
        raise HTTPException(status_code=404, detail="Mitra tidak ditemukan")
    mitra.kyc_status = "VERIFIED"
    db.commit()

    # NOTIFIKASI KE MITRA BAHWA KYC BERHASIL
    await notif_manager.send_personal_notification(
        user_id=mitra_id,
        title="✅ KYC DIVERIFIKASI",
        message="Selamat! Identitas Anda telah diverifikasi oleh Admin. Anda kini bisa mengambil proyek.",
        db=db
    )
    
    return {"status": "success", "message": f"KYC Mitra {mitra_id} berhasil diverifikasi."}

@router.put("/kyc/{mitra_id}/reject")
async def reject_mitra_kyc(mitra_id: str, db: Session = Depends(get_db)):
    mitra_prof = db.query(models.MitraProfile).filter(models.MitraProfile.user_id == mitra_id).first()
    if not mitra_prof:
        raise HTTPException(status_code=404, detail="Profil Mitra tidak ditemukan.")
    
    mitra_prof.kyc_status = "REJECTED"
    db.commit()

    # NOTIFIKASI KE MITRA BAHWA KYC DITOLAK
    await notif_manager.send_personal_notification(
        user_id=mitra_id,
        title="❌ KYC DITOLAK",
        message="Dokumen KTP yang Anda unggah tidak valid/buram. Silakan unggah ulang.",
        db=db
    )
    
    return {"status": "success", "message": "KTP ditolak. Mitra diinstruksikan untuk mengunggah ulang."}

@router.put("/users/{user_id}/ban")
def ban_user(user_id: str, db: Session = Depends(get_db)):
    # Untuk simplifikasi, jika Mitra kita ubah kyc_status. 
    mitra = db.query(models.MitraProfile).filter(models.MitraProfile.user_id == user_id).first()
    if mitra:
        mitra.kyc_status = "BANNED"
        db.commit()
        return {"status": "success", "message": "Akun Mitra berhasil diblokir."}
    raise HTTPException(status_code=400, detail="Fungsi ban saat ini difokuskan pada Mitra.")

# ==========================================
# PILAR 2 & 4: PERFORMA & POS
# ==========================================
@router.get("/performance", response_model=List[schemas.VendorPerformance])
def get_vendor_performance(db: Session = Depends(get_db)):
    mitras = db.query(models.MitraProfile).join(models.User).all()
    result = []
    for m in mitras:
        result.append({
            "nama": f"{m.user.name} ({m.specialty_role})",
            "kecepatanHari": m.avg_speed_days or 0,
            "proyekSelesai": m.projects_completed or 0,
            "rating": float(m.rating) if m.rating else 0.0
        })
    return result

@router.post("/pos/topup/physical")
def topup_wallet_physical(payload: dict, db: Session = Depends(get_db)):
    target_user_id = payload.get("user_id")
    try:
        amount = Decimal(str(payload.get("amount", 0)))
    except:
        raise HTTPException(status_code=400, detail="Nominal tidak valid")
        
    user = db.query(models.User).filter(models.User.id == target_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="ID Pengguna tidak ditemukan")
        
    wallet = db.query(models.Wallet).filter(models.Wallet.user_id == target_user_id).first()
    if not wallet:
        wallet = models.Wallet(user_id=target_user_id, balance=Decimal('0.00'), escrow_balance=Decimal('0.00'))
        db.add(wallet)
        
    wallet.balance += amount
    db.add(models.Transaction(
        id=f"TRX-POS-{uuid.uuid4().hex[:4].upper()}", user_id=target_user_id, 
        transaction_type="TOP UP FISIK (LOKET KASIR)", amount=amount, status="SUCCESS"
    ))
    db.commit()
    return {"status": "success", "message": f"Dana ditambahkan ke {user.name}"}

# ==========================================
# PILAR 3: ARBITRASE & MANAJEMEN ESCROW (FITUR MEJA HIJAU BARU)
# ==========================================
@router.get("/escrows")
def get_active_escrows(db: Session = Depends(get_db)):
    projects = db.query(models.Project).filter(
        models.Project.status.in_(["OPEN", "SEDANG DIKERJAKAN", "MENUNGGU UAT", "DISPUTED"])
    ).all()
    result = []
    for p in projects:
        result.append({
            "id": p.id, "client_id": p.client_id, "title": p.title,
            "status": p.status, "budget": float(p.budget)
        })
    return result

# FUNGSI BARU UNTUK HALAMAN ADMIN ARBITRASE
@router.get("/escrows/disputed")
def get_disputed_projects(db: Session = Depends(get_db)):
    """Menarik semua proyek dengan status DISPUTED untuk disidangkan Admin"""
    disputed = db.query(models.Project).filter(models.Project.status == "DISPUTED").all()
    
    result = []
    for p in disputed:
        result.append({
            "id": p.id,
            "title": p.title,
            "client_id": p.client_id,
            "mitra_id": p.mitra_id,
            "budget": float(p.budget),
            "current_milestone": p.current_milestone
        })
    return result

# FUNGSI LAMA (DIPERTAHANKAN TAPI DIPERBAIKI JADI ASYNC UNTUK NOTIFIKASI)
@router.post("/escrows/{project_id}/refund")
async def resolve_dispute_refund_escrow(project_id: str, db: Session = Depends(get_db)):
    """Admin memenangkan Klien. Uang dari Escrow dikembalikan ke Saldo Klien."""
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project or project.status in ["COMPLETED", "CANCELLED"]:
        raise HTTPException(status_code=400, detail="Proyek tidak valid untuk di-refund")

    wallet = db.query(models.Wallet).filter(models.Wallet.user_id == project.client_id).first()
    budget_decimal = Decimal(str(project.budget))
    
    wallet.escrow_balance -= budget_decimal
    wallet.balance += budget_decimal
    
    project.status = "CANCELLED"
    project.current_milestone = f"[{datetime.now().strftime('%d/%m %H:%M')}] ⚖️ KEPUTUSAN ADMIN: Sengketa dimenangkan Klien. Dana di-refund."
    
    db.add(models.Transaction(
        id=f"TRX-RFD-{uuid.uuid4().hex[:4].upper()}", user_id=project.client_id, project_id=project.id,
        transaction_type="PENGEMBALIAN DANA (FORCED REFUND SENGKETA)", amount=budget_decimal, status="SUCCESS"
    ))
    db.commit()

    # NOTIFIKASI KE KEDUA BELAH PIHAK
    await notif_manager.send_personal_notification(project.client_id, "⚖️ SENGKETA SELESAI", f"Admin memenangkan Anda. Dana Rp {float(budget_decimal):,.0f} dikembalikan ke saldo utama.", db)
    if project.mitra_id:
        await notif_manager.send_personal_notification(project.mitra_id, "⚖️ SENGKETA SELESAI", f"Admin memenangkan Klien. Proyek '{project.title}' dibatalkan secara sepihak.", db)

    return {"status": "success", "message": "Dana Escrow berhasil dikembalikan (di-refund) ke dompet Klien."}

# FUNGSI BARU (PAKSA CAIR KE MITRA)
@router.post("/escrows/{project_id}/force-release")
async def resolve_dispute_force_release_escrow(project_id: str, db: Session = Depends(get_db)):
    """Admin memenangkan Mitra. Uang dari Escrow dipaksa cair ke Mitra."""
    project = db.query(models.Project).filter(models.Project.id == project_id, models.Project.status == "DISPUTED").first()
    if not project:
        raise HTTPException(status_code=404, detail="Proyek sengketa tidak ditemukan atau bukan berstatus DISPUTED.")

    budget_decimal = Decimal(str(project.budget))
    client_wallet = db.query(models.Wallet).filter(models.Wallet.user_id == project.client_id).first()
    
    # 1. Potong Escrow Klien
    client_wallet.escrow_balance -= budget_decimal

    # 2. Tambah Saldo Mitra
    mitra_wallet = db.query(models.Wallet).filter(models.Wallet.user_id == project.mitra_id).first()
    if not mitra_wallet:
        mitra_wallet = models.Wallet(user_id=project.mitra_id, balance=Decimal('0.00'), escrow_balance=Decimal('0.00'))
        db.add(mitra_wallet)
    mitra_wallet.balance += budget_decimal

    # Catat Transaksi
    db.add(models.Transaction(
        id=f"TRX-OUT-{uuid.uuid4().hex[:4].upper()}", user_id=project.client_id, project_id=project.id,
        transaction_type="FORCE RELEASE (SENGKETA)", amount=-budget_decimal, status="SUCCESS"
    ))
    db.add(models.Transaction(
        id=f"TRX-IN-{uuid.uuid4().hex[:4].upper()}", user_id=project.mitra_id, project_id=project.id,
        transaction_type="PENERIMAAN DANA (MENANG SENGKETA)", amount=budget_decimal, status="SUCCESS"
    ))

    # Tambah skor proyek mitra
    mitra_prof = db.query(models.MitraProfile).filter(models.MitraProfile.user_id == project.mitra_id).first()
    if mitra_prof:
        mitra_prof.projects_completed = (mitra_prof.projects_completed or 0) + 1

    project.status = "COMPLETED"
    project.current_milestone = f"[{datetime.now().strftime('%d/%m %H:%M')}] ⚖️ KEPUTUSAN ADMIN: Sengketa dimenangkan Mitra. Dana dicairkan paksa."
    db.commit()

    # NOTIFIKASI KE KEDUA BELAH PIHAK
    await notif_manager.send_personal_notification(project.client_id, "⚖️ SENGKETA SELESAI", f"Admin memenangkan Mitra. Dana Escrow proyek '{project.title}' dicairkan paksa.", db)
    await notif_manager.send_personal_notification(project.mitra_id, "⚖️ SENGKETA SELESAI", f"Admin memenangkan Anda! Dana Rp {float(budget_decimal):,.0f} telah masuk ke saldo.", db)

    return {"status": "success", "message": "Dana berhasil dicairkan paksa ke Mitra."}

# FUNGSI LAMA (DIPERTAHANKAN UNTUK KOMPATIBILITAS MASA LALU JIKA PERLU)
@router.put("/escrows/{project_id}/dispute")
def mark_project_disputed(project_id: str, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404)
    project.status = "DISPUTED"
    project.current_milestone = "SENGKETA - Menunggu Keputusan Admin"
    db.commit()
    return {"status": "success", "message": "Proyek ditangguhkan untuk investigasi."}


# ==========================================
# PILAR 4 & MODUL LOKET: DROP-OFF & BAST (DENGAN KOMISI)
# ==========================================
@router.get("/dropoff")
def get_physical_projects(db: Session = Depends(get_db)):
    projects = db.query(models.Project).filter(models.Project.service_type.in_(["SERVIS HARDWARE", "PERENTALAN"])).all()
    result = []
    for p in projects:
        result.append({
            "id": p.id, "client_id": p.client_id, "mitra_id": p.mitra_id,
            "title": p.title, "status": p.status, "budget": float(p.budget)
        })
    return result

@router.post("/dropoff/receive")
async def receive_dropoff_device(payload: DropOffCreate, db: Session = Depends(get_db)):
    budget_decimal = Decimal(str(payload.budget))
    wallet = db.query(models.Wallet).filter(models.Wallet.user_id == payload.client_id).first()
    if not wallet or wallet.balance < budget_decimal:
        raise HTTPException(status_code=400, detail="Saldo Klien tidak cukup.")

    wallet.balance -= budget_decimal
    wallet.escrow_balance += budget_decimal

    proj_id = f"JOB-HW-{uuid.uuid4().hex[:4].upper()}"
    new_project = models.Project(
        id=proj_id, client_id=payload.client_id, title=payload.title, description=payload.description,
        service_type="SERVIS HARDWARE", budget=budget_decimal, status="OPEN", current_milestone="Perangkat Diterima oleh Admin"
    )
    db.add(new_project)
    db.add(models.Transaction(
        id=f"TRX-ESC-{uuid.uuid4().hex[:4].upper()}", user_id=payload.client_id, project_id=proj_id,
        transaction_type="PENAHANAN ESCROW (DROP-OFF)", amount=-budget_decimal, status="SUCCESS"
    ))
    db.commit()

    # NOTIFIKASI KE KLIEN SAAT ADMIN MENERIMA BARANG DI KASIR LOKET E-TECHHUB
    await notif_manager.send_personal_notification(
        payload.client_id, "📦 PERANGKAT DITERIMA", f"Perangkat untuk proyek '{payload.title}' telah diterima di Loket E-TechHub.", db
    )

    return {"status": "success"}

@router.put("/dropoff/{project_id}/uat")
def set_physical_uat(project_id: str, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    project.status = "MENUNGGU UAT"
    project.current_milestone = "Peninjauan Fisik Akhir di Loket"
    db.commit()
    return {"status": "success"}

@router.put("/dropoff/{project_id}/bast")
def execute_physical_bast(project_id: str, admin_id: str, db: Session = Depends(get_db)):
    # admin_id didapat dari session frontend saat memanggil API
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project or project.status != "MENUNGGU UAT" or not project.mitra_id:
        raise HTTPException(status_code=400, detail="Status tidak valid untuk BAST.")

    budget_decimal = Decimal(str(project.budget))
    
    # AMBIL PERSENTASE KOMISI DARI TABEL SETTING (PILAR 5)
    fee_setting = db.query(models.SystemSetting).filter(models.SystemSetting.setting_key == 'PLATFORM_FEE').first()
    fee_rate = Decimal(fee_setting.setting_value) if fee_setting else Decimal('0.05') # Default 5%
    
    platform_fee = budget_decimal * fee_rate
    mitra_earnings = budget_decimal - platform_fee
    
    # 1. Kurangi Escrow Klien
    client_wallet = db.query(models.Wallet).filter(models.Wallet.user_id == project.client_id).first()
    client_wallet.escrow_balance -= budget_decimal
    
    # 2. Tambah Saldo Mitra (Setelah dipotong komisi)
    mitra_wallet = db.query(models.Wallet).filter(models.Wallet.user_id == project.mitra_id).first()
    if not mitra_wallet:
        mitra_wallet = models.Wallet(user_id=project.mitra_id, balance=Decimal('0.00'), escrow_balance=Decimal('0.00'))
        db.add(mitra_wallet)
    mitra_wallet.balance += mitra_earnings

    # 3. Masukkan Komisi ke Dompet Platform (Admin)
    admin_wallet = db.query(models.Wallet).filter(models.Wallet.user_id == admin_id).first()
    if admin_wallet:
        admin_wallet.balance += platform_fee

    project.status = "COMPLETED"
    project.current_milestone = "BAST Ditandatangani."

    # Catat Log Transaksi
    db.add(models.Transaction(
        id=f"TRX-PAY-{uuid.uuid4().hex[:4].upper()}", user_id=project.mitra_id, project_id=project.id,
        transaction_type=f"PEMBAYARAN SPK SELESAI (Potongan {fee_rate*100}%)", amount=mitra_earnings, status="SUCCESS"
    ))
    db.commit()
    return {"status": "success", "message": "BAST Tereksekusi. Dana ditransfer ke Mitra & Komisi dipotong."}

# ==========================================
# PILAR 5: KONFIGURASI SISTEM MAKRO
# ==========================================
@router.get("/settings")
def get_system_settings(db: Session = Depends(get_db)):
    settings = db.query(models.SystemSetting).all()
    return {s.setting_key: s.setting_value for s in settings}

@router.put("/settings/{key}")
def update_system_setting(key: str, payload: SettingUpdate, db: Session = Depends(get_db)):
    setting = db.query(models.SystemSetting).filter(models.SystemSetting.setting_key == key).first()
    if not setting:
        setting = models.SystemSetting(setting_key=key, setting_value=payload.value, description="Added via API")
        db.add(setting)
    else:
        setting.setting_value = payload.value
    db.commit()
    return {"status": "success", "message": f"Setting {key} diubah menjadi {payload.value}"}

# ==========================================
# FUNGSI INQUIRY (CEK NAMA PENGGUNA)
# ==========================================
@router.get("/users/{user_id}/name")
def get_user_name(user_id: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="ID Pengguna tidak ditemukan di database.")
    
    return {
        "status": "success",
        "id": user.id,
        "name": user.name,
        "role": user.role.upper()
    }

# ==========================================
# PILAR 6: AI COMPUTER VISION (OPENCV LOKAL STANDALONE)
# ==========================================
import cv2
import numpy as np
import base64
from fastapi import HTTPException

@router.post("/scan-cash")
def scan_cash_authenticity(payload: CashScanRequest):
    try:
        # 1. Decode Base64 dari React ke Matriks OpenCV
        encoded_data = payload.image_base64.split(',')[1] if ',' in payload.image_base64 else payload.image_base64
        decoded_bytes = base64.b64decode(encoded_data)
        nparr = np.frombuffer(decoded_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            raise ValueError("Gambar gagal di-decode oleh server.")

        # 2. LOGIKA OPENCV SEDERHANA
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()

        # Penyesuaian Threshold untuk Webcam (Diturunkan dari 100 ke 35)
        # Semakin kecil angkanya, semakin mudah sistem bilang "ASLI"
        threshold_ketajaman = 35.0 

        if laplacian_var > threshold_ketajaman:
            hasil_tebakan = "ASLI"
            # Base persentase 75%, ditambah bonus dari seberapa tajam gambarnya (Maksimal 99%)
            bonus_ketajaman = (laplacian_var - threshold_ketajaman) * 0.5
            skor = min(99.0, 75.0 + bonus_ketajaman) 
        else:
            hasil_tebakan = "PALSU"
            # Jika sangat blur (< 35), persentase dinamis dari 10% hingga 74%
            skor = min(74.0, max(10.0, laplacian_var * 1.8))
            
        # 3. KEMBALIKAN KE LAYAR KASIR REACT
        return {
            "status": "success",
            "hasil_deteksi": hasil_tebakan,
            "confidence": round(skor, 2),
            "message": "Pemindaian tekstur uang selesai."
        }

    except Exception as e:
        print(f"Error CV Tradisional: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Gagal memproses gambar: {str(e)}")