from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from typing import List, Optional
from pydantic import BaseModel
import uuid
from decimal import Decimal
from reportlab.pdfgen import canvas
import io

from app.core.database import get_db
from app.models import domain_models as models
from app.schemas import response_schemas as schemas

router = APIRouter(prefix="/api/client", tags=["Client"])

# --- Skema Input untuk POST Project ---
# --- Skema Input untuk POST Project DIUPDATE ---
class ProjectCreate(BaseModel):
    title: str
    service_type: str
    budget: float
    description: str
    deadline_days: int          
    tags: Optional[List[str]] = []

# ==========================================
# 1. MANAJEMEN DOMPET & KEUANGAN
# ==========================================

@router.get("/{client_id}/wallet")
def get_client_wallet(client_id: str, db: Session = Depends(get_db)):
    wallet = db.query(models.Wallet).filter(models.Wallet.user_id == client_id).first()
    if not wallet:
        return {"balance": 0.00, "escrow_balance": 0.00}
    return {
        "balance": float(wallet.balance), 
        "escrow_balance": float(wallet.escrow_balance)
    }

@router.post("/{client_id}/topup/online")
def topup_wallet_online(client_id: str, payload: dict, db: Session = Depends(get_db)):
    try:
        amount = Decimal(str(payload.get("amount", 0)))
    except:
        raise HTTPException(status_code=400, detail="Format angka tidak valid")
        
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Nominal tidak valid")
        
    wallet = db.query(models.Wallet).filter(models.Wallet.user_id == client_id).first()
    if not wallet:
        wallet = models.Wallet(user_id=client_id, balance=Decimal('0.00'), escrow_balance=Decimal('0.00'))
        db.add(wallet)
        
    wallet.balance += amount
    
    trx_id = f"TRX-PG-{uuid.uuid4().hex[:4].upper()}"
    new_trx = models.Transaction(
        id=trx_id, user_id=client_id, transaction_type="TOP UP ONLINE (PAYMENT GATEWAY)",
        amount=amount, status="SUCCESS"
    )
    db.add(new_trx)
    db.commit()
    
    return {"status": "success", "message": "Top-up berhasil", "new_balance": float(wallet.balance)}

@router.get("/{client_id}/transactions")
def get_client_transactions(client_id: str, db: Session = Depends(get_db)):
    trx = db.query(models.Transaction).filter(models.Transaction.user_id == client_id).all()
    result = []
    for t in trx:
        prefix = "+" if t.amount >= 0 else "-"
        amount_formatted = f"{prefix} Rp {abs(t.amount):,.0f}".replace(",", ".")
        date_str = t.created_at.strftime("%d %b %Y").upper() if t.created_at else "HARI INI"
        result.append({
            "id": t.id,
            "date": date_str,
            "type": t.transaction_type,
            "amount": amount_formatted,
            "status": t.status
        })
    return result


# ==========================================
# 2. MANAJEMEN PROYEK (SPK) & ESCROW
# ==========================================

@router.get("/mitras")
def get_mitra_directory(db: Session = Depends(get_db)):
    mitras = db.query(models.MitraProfile).join(models.User).all()
    result = []
    for m in mitras:
        tags = ["TERVERIFIKASI", m.specialty_role.split()[0].upper()]
        result.append({
            "id": m.user_id,
            "name": m.user.name,
            "role": m.specialty_role,
            "rating": str(m.rating),
            "tags": tags,
            "rate": m.hourly_rate_or_fee or "Hubungi Langsung"
        })
    return result

@router.post("/{client_id}/projects")
def create_new_project(client_id: str, project: ProjectCreate, db: Session = Depends(get_db)):
    budget_decimal = Decimal(str(project.budget))
    
    # KUNCI ESCROW: Cek saldo & potong dana
    wallet = db.query(models.Wallet).filter(models.Wallet.user_id == client_id).first()
    
    if not wallet or wallet.balance < budget_decimal:
        raise HTTPException(
            status_code=400, 
            detail="Saldo Available tidak mencukupi. Silakan Top-Up terlebih dahulu."
        )

    wallet.balance -= budget_decimal
    wallet.escrow_balance += budget_decimal

    # BUAT PROYEK BARU DENGAN DEADLINE
    unique_proj_id = f"JOB-2026-{uuid.uuid4().hex[:4].upper()}"
    new_project = models.Project(
        id=unique_proj_id,
        client_id=client_id,
        title=project.title,
        service_type=project.service_type,
        budget=budget_decimal,
        description=project.description,
        deadline_days=project.deadline_days, # Menyimpan Deadline
        status="OPEN"
    )
    
    # PROSES TAGS (RELASI MANY-TO-MANY)
    for tag_name in project.tags:
        tag_clean = tag_name.strip().upper()
        if not tag_clean:
            continue
            
        # Cek apakah tag sudah pernah ada di database
        existing_tag = db.query(models.Tag).filter(models.Tag.tag_name == tag_clean).first()
        
        # Jika belum ada, tambahkan tag baru ke tabel tags
        if not existing_tag:
            existing_tag = models.Tag(tag_name=tag_clean)
            db.add(existing_tag)
            db.flush() # Segera proses agar ID tag didapatkan
            
        # Hubungkan tag dengan proyek ini
        new_project.tags.append(existing_tag)

    db.add(new_project)

    # CATAT TRANSAKSI PENAHANAN
    trx_id = f"TRX-ESC-{uuid.uuid4().hex[:4].upper()}"
    new_trx = models.Transaction(
        id=trx_id, user_id=client_id, project_id=unique_proj_id,
        transaction_type="PENAHANAN DANA (ESCROW)",
        amount=-budget_decimal, status="SUCCESS"
    )
    db.add(new_trx)
    
    try:
        db.commit()
        return {"status": "success", "message": "Proyek publikasi. Dana ditahan.", "project_id": unique_proj_id}
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail="Gagal menyimpan ke database.")

@router.get("/{client_id}/contracts", response_model=List[schemas.ContractDashboard])
def get_client_contracts(client_id: str, db: Session = Depends(get_db)):
    projects = db.query(models.Project).filter(models.Project.client_id == client_id).all()
    result = []
    for proj in projects:
        mitra_name = proj.mitra.name if proj.mitra else "Belum Ada Mitra"
        escrow_formatted = f"Rp {proj.budget:,.0f}".replace(",", ".")
        result.append({
            "id": proj.id,
            "title": proj.title,
            "mitra": mitra_name,
            "type": proj.service_type.capitalize(),
            "status": proj.status,
            "escrow": escrow_formatted,
            "milestone": proj.current_milestone or "Menunggu Tahap 1"
        })
    return result

@router.put("/{client_id}/contracts/{contract_id}/approve")
def approve_contract_uat(client_id: str, contract_id: str, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(
        models.Project.id == contract_id, 
        models.Project.client_id == client_id
    ).first()
    
    if not project or project.status != "MENUNGGU UAT":
        raise HTTPException(status_code=400, detail="Kontrak tidak valid atau belum UAT")

    client_wallet = db.query(models.Wallet).filter(models.Wallet.user_id == client_id).first()
    budget_decimal = Decimal(str(project.budget))
    
    # 1. Hapus dana dari escrow klien
    client_wallet.escrow_balance -= budget_decimal

    # 2. Pindahkan dana ke dompet mitra
    if project.mitra_id:
        mitra_wallet = db.query(models.Wallet).filter(models.Wallet.user_id == project.mitra_id).first()
        if not mitra_wallet:
            mitra_wallet = models.Wallet(user_id=project.mitra_id, balance=Decimal('0.00'), escrow_balance=Decimal('0.00'))
            db.add(mitra_wallet)
        
        mitra_wallet.balance += budget_decimal

        db.add(models.Transaction(
            id=f"TRX-IN-{uuid.uuid4().hex[:4].upper()}", user_id=project.mitra_id, project_id=contract_id,
            transaction_type="PENERIMAAN DANA (SPK SELESAI)", amount=budget_decimal, status="SUCCESS"
        ))

    # Catat pengeluaran Klien
    db.add(models.Transaction(
        id=f"TRX-OUT-{uuid.uuid4().hex[:4].upper()}", user_id=client_id, project_id=contract_id,
        transaction_type="BAST TERBIT (ESCROW RELEASE)", amount=-budget_decimal, status="SUCCESS"
    ))

    # Update Status Proyek
    project.status = "COMPLETED"
    project.current_milestone = "Selesai (BAST Diterbitkan)"
    db.commit()

    return {"status": "success", "message": "UAT Disetujui, Dana Dicairkan ke Mitra"}

@router.get("/{client_id}/contracts/{contract_id}/pdf")
def generate_contract_pdf(client_id: str, contract_id: str, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(
        models.Project.id == contract_id,
        models.Project.client_id == client_id
    ).first()

    if not project:
        raise HTTPException(status_code=404, detail="Kontrak tidak ditemukan")

    buffer = io.BytesIO()
    pdf = canvas.Canvas(buffer)
    
    pdf.setFont("Helvetica-Bold", 16)
    pdf.drawString(170, 800, "SURAT PERINTAH KERJA (SPK)")
    
    pdf.setFont("Helvetica", 12)
    pdf.drawString(50, 750, f"ID Kontrak   : {project.id}")
    pdf.drawString(50, 730, f"Judul Proyek : {project.title}")
    pdf.drawString(50, 710, f"Tipe Layanan : {project.service_type}")
    pdf.drawString(50, 690, f"Nilai Escrow : Rp {project.budget:,.0f}".replace(",", "."))
    
    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawString(50, 640, "Pihak Pertama (Klien):")
    pdf.setFont("Helvetica", 12)
    pdf.drawString(50, 620, project.client.name)
    
    mitra_name = project.mitra.name if project.mitra else "Menunggu Bursa Kerja"
    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawString(300, 640, "Pihak Kedua (Mitra):")
    pdf.setFont("Helvetica", 12)
    pdf.drawString(300, 620, mitra_name)
    
    pdf.line(50, 580, 550, 580)
    pdf.setFont("Helvetica-Oblique", 10)
    pdf.drawString(50, 560, "Pernyataan Click-Wrap Agreement:")
    pdf.drawString(50, 545, "Dokumen ini dicetak otomatis oleh sistem E-TechHub dan sah secara elektronik")
    pdf.drawString(50, 530, "mengikat kedua belah pihak sesuai ketentuan UU ITE yang berlaku.")
    
    pdf.showPage()
    pdf.save()
    
    buffer.seek(0)
    return Response(content=buffer.getvalue(), media_type="application/pdf")