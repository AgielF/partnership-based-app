from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from typing import List, Optional
from pydantic import BaseModel
import uuid
from decimal import Decimal
from reportlab.pdfgen import canvas
import io
from datetime import datetime # DITAMBAHKAN AGAR TIDAK ERROR SAAT SIGN CLICK-WRAP

from app.core.database import get_db
from app.models import domain_models as models
from app.schemas import response_schemas as schemas
from fastapi import Request
import midtransclient

router = APIRouter(prefix="/api/client", tags=["Client"])

# --- Skema Input untuk POST Project DIUPDATE ---
class ProjectCreate(BaseModel):
    title: str
    service_type: str
    budget: float
    description: str
    deadline_days: int          
    tags: Optional[List[str]] = []

snap = midtransclient.Snap(
    is_production=False,
    server_key='TARUH_SERVER_KEY_DISINI',
    client_key='TARUH_SERVER_KEY_DISINI'
)

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
        amount = int(Decimal(str(payload.get("amount", 0)))) # Midtrans butuh format integer
    except:
        raise HTTPException(status_code=400, detail="Format angka tidak valid")
        
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Nominal tidak valid")

    # Ambil data user untuk info pelanggan di Midtrans
    user = db.query(models.User).filter(models.User.id == client_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
        
    # 1. Buat Order ID & Catat Transaksi sebagai PENDING
    trx_id = f"TRX-{uuid.uuid4().hex[:10].upper()}"
    new_trx = models.Transaction(
        id=trx_id, 
        user_id=client_id, 
        transaction_type="TOP UP ONLINE (MIDTRANS)",
        amount=amount, 
        status="PENDING" # Saldo BELUM bertambah
    )
    db.add(new_trx)
    db.commit()
    
    # 2. Siapkan parameter untuk dikirim ke Midtrans
    param = {
        "transaction_details": {
            "order_id": trx_id,
            "gross_amount": amount
        },
        "customer_details": {
            "first_name": user.name,
            "email": user.email
        }
    }

    try:
        # 3. Minta Token Snap ke server Midtrans
        transaction = snap.create_transaction(param)
        return {
            "status": "success", 
            "message": "Token berhasil dibuat", 
            "token": transaction['token']
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Gagal menghubungi Midtrans: {str(e)}")

# ==========================================
# 1.B. WEBHOOK (CRITICAL): Mendengarkan Notifikasi Midtrans
# ==========================================
@router.post("/midtrans/webhook")
async def midtrans_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.json()
    
    order_id = payload.get('order_id')
    transaction_status = payload.get('transaction_status')
    fraud_status = payload.get('fraud_status')

    # Cari transaksi di database
    trx = db.query(models.Transaction).filter(models.Transaction.id == order_id).first()
    if not trx:
        return {"status": "ignored", "message": "Transaksi tidak ditemukan"}

    # Jika sudah SUCCESS, hiraukan (menghindari double webhook)
    if trx.status == 'SUCCESS':
        return {"status": "ignored", "message": "Transaksi sudah diproses sebelumnya"}

    # Analisis Status Midtrans
    if transaction_status == 'capture' or transaction_status == 'settlement':
        if fraud_status != 'challenge':
            # PEMBAYARAN BERHASIL -> UPDATE STATUS DAN TAMBAH SALDO
            trx.status = 'SUCCESS'
            
            wallet = db.query(models.Wallet).filter(models.Wallet.user_id == trx.user_id).first()
            if not wallet:
                wallet = models.Wallet(user_id=trx.user_id, balance=Decimal('0.00'), escrow_balance=Decimal('0.00'))
                db.add(wallet)
            
            wallet.balance += trx.amount
            db.commit()
            
    elif transaction_status in ['cancel', 'deny', 'expire']:
        # PEMBAYARAN GAGAL/EXPIRED
        trx.status = 'FAILED'
        db.commit()

    return {"status": "ok"}

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
        deadline_days=project.deadline_days,
        status="OPEN"
    )
    
    # PROSES TAGS (RELASI MANY-TO-MANY)
    for tag_name in project.tags:
        tag_clean = tag_name.strip().upper()
        if not tag_clean:
            continue
            
        existing_tag = db.query(models.Tag).filter(models.Tag.tag_name == tag_clean).first()
        
        if not existing_tag:
            existing_tag = models.Tag(tag_name=tag_clean)
            db.add(existing_tag)
            db.flush()
            
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

# --- RUTE GET CONTRACTS YANG BENAR (SUDAH DIGABUNGKAN) ---
@router.get("/{client_id}/contracts")
def get_client_contracts(client_id: str, db: Session = Depends(get_db)):
    projects = db.query(models.Project).filter(models.Project.client_id == client_id).all()
    
    result = []
    for proj in projects:
        # Jika relasi DB belum diset sempurna, kembalikan ID mitra
        mitra_name = proj.mitra.name if getattr(proj, 'mitra', None) else proj.mitra_id
        
        # PENTING: Response harus seragam dengan ekspektasi Frontend React
        result.append({
            "id": proj.id,
            "title": proj.title,
            "mitra": mitra_name,
            "type": proj.service_type,
            "status": proj.status,
            "budget": float(proj.budget) if proj.budget else 0,
            "deadline_days": proj.deadline_days,
            
            # KUNCI UNTUK MENAMPILKAN TEKS TERMINAL DI REACT
            "current_milestone": proj.current_milestone 
        })
        
    return result

# ==========================================
# 3. KONTRAK & BAST
# ==========================================

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
    project.current_milestone = f"[{datetime.now().strftime('%d/%m %H:%M')}] BAST Diterbitkan. Proyek Selesai."
    db.commit()

    return {"status": "success", "message": "UAT Disetujui, Dana Dicairkan ke Mitra"}

# ==========================================
# PENOLAKAN UAT / SENGKETA (DISPUTE) OLEH KLIEN
# ==========================================
@router.put("/{client_id}/contracts/{contract_id}/reject")
def reject_contract_uat(client_id: str, contract_id: str, db: Session = Depends(get_db)):
    # 1. Pastikan proyek milik Klien yang login
    project = db.query(models.Project).filter(
        models.Project.id == contract_id, 
        models.Project.client_id == client_id
    ).first()
    
    if not project or project.status != "MENUNGGU UAT":
        raise HTTPException(status_code=400, detail="Kontrak tidak valid atau belum masuk tahap UAT")

    # 2. Ubah status menjadi Sengketa (Disputed)
    project.status = "DISPUTED"
    project.current_milestone = f"[{datetime.now().strftime('%d/%m %H:%M')}] ❌ UAT DITOLAK KLIEN. Proyek masuk status Sengketa (Arbitrase Admin)."
    
    db.commit()

    return {"status": "success", "message": "Proyek ditangguhkan. Admin akan meninjau sengketa ini."}

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
    # Gunakan client_id jika relasi tabel belum ditarik
    client_name = project.client.name if getattr(project, 'client', None) else project.client_id
    pdf.drawString(50, 620, client_name)
    
    mitra_name = project.mitra.name if getattr(project, 'mitra', None) else (project.mitra_id or "Menunggu Bursa Kerja")
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

# ==========================================
# E-CONTRACT / PERSETUJUAN KLIEN
# ==========================================
@router.put("/contracts/{project_id}/sign")
def sign_client_contract(project_id: str, client_id: str, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(
        models.Project.id == project_id,
        models.Project.client_id == client_id
    ).first()

    if not project:
        raise HTTPException(status_code=404, detail="Proyek atau kontrak tidak ditemukan.")

    if project.status in ["COMPLETED", "CANCELLED"]:
        raise HTTPException(status_code=400, detail="Kontrak sudah tidak bisa ditandatangani.")

    project.current_milestone = f"[{datetime.now().strftime('%d/%m %H:%M')}] Kontrak disetujui Klien via Click-Wrap."
    
    db.commit()
    return {"status": "success", "message": "Click-Wrap Agreement berhasil disahkan secara hukum."}