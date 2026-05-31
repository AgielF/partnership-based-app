import os
import uuid
import io
from decimal import Decimal
from datetime import datetime 
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Response, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from reportlab.pdfgen import canvas
import midtransclient

from app.core.database import get_db
from app.models import domain_models as models
from app.routers.notification_router import notif_manager

router = APIRouter(prefix="/api/client", tags=["Client"])

# =========================================================================
# SKEMA PYDANTIC
# =========================================================================
class ProjectCreate(BaseModel):
    title: str
    service_type: str
    budget: float
    description: str
    deadline_days: int          
    tags: Optional[List[str]] = []

class MitraPublicProfile(BaseModel):
    id: str
    name_masked: str
    specialty_role: str
    rating: float
    projects_completed: int
    hourly_rate_or_fee: str

class DeliverableReviewPayload(BaseModel):
    status: str 
    feedback: Optional[str] = None

class UATApprovePayload(BaseModel):
    rating: float = 5.0 

# INISIALISASI MIDTRANS
snap = midtransclient.Snap(
    is_production=False,
    server_key=os.getenv("MIDTRANS_SERVER_KEY", ""),
    client_key=os.getenv("MIDTRANS_CLIENT_KEY", "")
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
        amount = int(Decimal(str(payload.get("amount", 0))))
    except:
        raise HTTPException(status_code=400, detail="Format angka tidak valid")
        
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Nominal tidak valid")

    user = db.query(models.User).filter(models.User.id == client_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
        
    trx_id = f"TRX-{uuid.uuid4().hex[:10].upper()}"
    new_trx = models.Transaction(
        id=trx_id, user_id=client_id, transaction_type="TOP UP ONLINE (MIDTRANS)",
        amount=amount, status="PENDING" 
    )
    db.add(new_trx)
    db.commit()
    
    param = {
        "transaction_details": {"order_id": trx_id, "gross_amount": amount},
        "customer_details": {"first_name": user.name, "email": user.email}
    }

    try:
        transaction = snap.create_transaction(param)
        return {"status": "success", "message": "Token dibuat", "token": transaction['token']}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Gagal menghubungi Midtrans: {str(e)}")

@router.post("/midtrans/webhook")
async def midtrans_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.json()
    order_id = payload.get('order_id')
    transaction_status = payload.get('transaction_status')
    fraud_status = payload.get('fraud_status')

    trx = db.query(models.Transaction).filter(models.Transaction.id == order_id).first()
    if not trx or trx.status == 'SUCCESS':
        return {"status": "ignored"}

    if transaction_status in ['capture', 'settlement'] and fraud_status != 'challenge':
        trx.status = 'SUCCESS'
        wallet = db.query(models.Wallet).filter(models.Wallet.user_id == trx.user_id).first()
        if not wallet:
            wallet = models.Wallet(user_id=trx.user_id, balance=Decimal('0.00'), escrow_balance=Decimal('0.00'))
            db.add(wallet)
        wallet.balance += trx.amount
        db.commit()
    elif transaction_status in ['cancel', 'deny', 'expire']:
        trx.status = 'FAILED'
        db.commit()

    return {"status": "ok"}

@router.get("/{client_id}/transactions")
def get_client_transactions(client_id: str, db: Session = Depends(get_db)):
    trx = db.query(models.Transaction).filter(models.Transaction.user_id == client_id).all()
    result = []
    for t in trx:
        prefix = "+" if t.amount >= 0 else "-"
        result.append({
            "id": t.id,
            "date": t.created_at.strftime("%d %b %Y").upper() if t.created_at else "HARI INI",
            "type": t.transaction_type,
            "amount": f"{prefix} Rp {abs(t.amount):,.0f}".replace(",", "."),
            "status": t.status
        })
    return result

# ==========================================
# 2. MANAJEMEN PROYEK & KONTRAK
# ==========================================
@router.get("/mitras")
def get_mitra_directory(db: Session = Depends(get_db)):
    mitras = db.query(models.MitraProfile).join(models.User).all()
    result = []
    for m in mitras:
        result.append({
            "id": m.user_id,
            "name": m.user.name,
            "role": m.specialty_role,
            "rating": str(m.rating),
            "tags": ["TERVERIFIKASI", m.specialty_role.split()[0].upper()],
            "rate": m.hourly_rate_or_fee or "Hubungi Langsung"
        })
    return result

@router.post("/{client_id}/projects")
def create_new_project(client_id: str, project: ProjectCreate, db: Session = Depends(get_db)):
    budget_decimal = Decimal(str(project.budget))
    wallet = db.query(models.Wallet).filter(models.Wallet.user_id == client_id).first()
    
    if not wallet or wallet.balance < budget_decimal:
        raise HTTPException(status_code=400, detail="Saldo tidak mencukupi.")

    wallet.balance -= budget_decimal
    wallet.escrow_balance += budget_decimal

    unique_proj_id = f"JOB-2026-{uuid.uuid4().hex[:4].upper()}"
    new_project = models.Project(
        id=unique_proj_id, client_id=client_id, title=project.title,
        service_type=project.service_type, budget=budget_decimal,
        description=project.description, deadline_days=project.deadline_days, status="OPEN"
    )
    
    for tag_name in project.tags:
        tag_clean = tag_name.strip().upper()
        if not tag_clean: continue
        existing_tag = db.query(models.Tag).filter(models.Tag.tag_name == tag_clean).first()
        if not existing_tag:
            existing_tag = models.Tag(tag_name=tag_clean)
            db.add(existing_tag)
            db.flush()
        new_project.tags.append(existing_tag)

    db.add(new_project)
    db.add(models.Transaction(
        id=f"TRX-ESC-{uuid.uuid4().hex[:4].upper()}", user_id=client_id, project_id=unique_proj_id,
        transaction_type="PENAHANAN DANA (ESCROW)", amount=-budget_decimal, status="SUCCESS"
    ))
    
    db.commit()
    return {"status": "success", "message": "Proyek dipublikasi.", "project_id": unique_proj_id}

@router.get("/{client_id}/contracts")
def get_client_contracts(client_id: str, db: Session = Depends(get_db)):
    projects = db.query(models.Project).filter(models.Project.client_id == client_id).all()
    result = []
    for proj in projects:
        result.append({
            "id": proj.id, "title": proj.title, "mitra_id": proj.mitra_id,     
            "mitra": proj.mitra.name if getattr(proj, 'mitra', None) else proj.mitra_id,            
            "type": proj.service_type, "status": proj.status,
            "budget": float(proj.budget) if proj.budget else 0,
            "deadline_days": proj.deadline_days, "current_milestone": proj.current_milestone 
        })
    return result

@router.put("/{client_id}/contracts/{contract_id}/approve")
async def approve_contract_uat(client_id: str, contract_id: str, payload: UATApprovePayload = None, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == contract_id, models.Project.client_id == client_id).first()
    if not project or project.status != "MENUNGGU UAT":
        raise HTTPException(status_code=400, detail="Kontrak tidak valid/belum UAT")

    client_wallet = db.query(models.Wallet).filter(models.Wallet.user_id == client_id).first()
    budget_decimal = Decimal(str(project.budget))
    client_wallet.escrow_balance -= budget_decimal

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

        mitra_profile = db.query(models.MitraProfile).filter(models.MitraProfile.user_id == project.mitra_id).first()
        if mitra_profile:
            current_completed = mitra_profile.projects_completed or 0
            current_rating = float(mitra_profile.rating) if mitra_profile.rating else 0.0
            current_speed = float(mitra_profile.avg_speed_days) if mitra_profile.avg_speed_days else 0.0
            delta_t = (datetime.now() - project.created_at).days if hasattr(project, 'created_at') and project.created_at else 1
            if delta_t < 1: delta_t = 1
            new_star = payload.rating if payload else 5.0
            new_rating = ((current_rating * current_completed) + new_star) / (current_completed + 1)
            new_speed = ((current_speed * current_completed) + delta_t) / (current_completed + 1)
            mitra_profile.rating = round(new_rating, 2)
            mitra_profile.avg_speed_days = round(new_speed, 1)
            mitra_profile.projects_completed = current_completed + 1

    db.add(models.Transaction(
        id=f"TRX-OUT-{uuid.uuid4().hex[:4].upper()}", user_id=client_id, project_id=contract_id,
        transaction_type="BAST TERBIT (ESCROW RELEASE)", amount=-budget_decimal, status="SUCCESS"
    ))

    project.status = "COMPLETED"
    project.current_milestone = f"[{datetime.now().strftime('%d/%m %H:%M')}] BAST Diterbitkan."
    db.commit()

    if project.mitra_id:
        await notif_manager.send_personal_notification(
            user_id=project.mitra_id, title="💰 DANA ESCROW CAIR",
            message=f"Dana Rp {float(budget_decimal):,.0f} dari '{project.title}' masuk ke saldo Anda.", db=db
        )
    return {"status": "success"}

@router.put("/{client_id}/contracts/{contract_id}/reject")
async def reject_contract_uat(client_id: str, contract_id: str, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == contract_id, models.Project.client_id == client_id).first()
    if not project or project.status != "MENUNGGU UAT":
        raise HTTPException(status_code=400, detail="Kontrak tidak valid.")
    project.status = "DISPUTED"
    project.current_milestone = f"[{datetime.now().strftime('%d/%m %H:%M')}] ❌ UAT DITOLAK KLIEN."
    db.commit()
    if project.mitra_id:
        await notif_manager.send_personal_notification(
            user_id=project.mitra_id, title="🚨 PERINGATAN SENGKETA",
            message=f"Klien menolak UAT Proyek '{project.title}'.", db=db
        )
    return {"status": "success", "message": "Proyek ditangguhkan."}

@router.get("/{client_id}/contracts/{contract_id}/pdf")
def generate_contract_pdf(client_id: str, contract_id: str, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == contract_id, models.Project.client_id == client_id).first()
    if not project: raise HTTPException(status_code=404, detail="Kontrak tidak ditemukan")
    buffer = io.BytesIO()
    pdf = canvas.Canvas(buffer)
    pdf.setFont("Helvetica-Bold", 16)
    pdf.drawString(170, 800, "SURAT PERINTAH KERJA (SPK)")
    pdf.setFont("Helvetica", 12)
    pdf.drawString(50, 750, f"ID Kontrak   : {project.id}")
    pdf.drawString(50, 730, f"Judul Proyek : {project.title}")
    pdf.drawString(50, 710, f"Nilai Escrow : Rp {project.budget:,.0f}".replace(",", "."))
    pdf.showPage()
    pdf.save()
    buffer.seek(0)
    return Response(content=buffer.getvalue(), media_type="application/pdf")

@router.put("/contracts/{project_id}/sign")
def sign_client_contract(project_id: str, client_id: str, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id, models.Project.client_id == client_id).first()
    if not project or project.status in ["COMPLETED", "CANCELLED"]:
        raise HTTPException(status_code=400, detail="Kontrak tidak valid.")
    project.current_milestone = f"[{datetime.now().strftime('%d/%m %H:%M')}] Kontrak disetujui Klien via Click-Wrap."
    db.commit()
    return {"status": "success"}

def mask_name(full_name: str) -> str:
    if not full_name: return "Anonim"
    parts = full_name.strip().split()
    return f"{parts[0]} {parts[1][0]}." if len(parts) > 1 else full_name

@router.get("/mitras/{mitra_id}/public", response_model=MitraPublicProfile)
def get_mitra_public_profile(mitra_id: str, db: Session = Depends(get_db)):
    mitra_data = db.query(models.MitraProfile).filter(models.MitraProfile.user_id == mitra_id).first()
    if not mitra_data or not mitra_data.user: raise HTTPException(status_code=404)
    return {
        "id": mitra_data.user_id, "name_masked": mask_name(mitra_data.user.name),
        "specialty_role": mitra_data.specialty_role or "Spesialis Umum",
        "rating": float(mitra_data.rating) if mitra_data.rating else 0.0,
        "projects_completed": mitra_data.projects_completed or 0,
        "hourly_rate_or_fee": mitra_data.hourly_rate_or_fee or "Tarif Negosiasi"
    }

@router.get("/projects/{project_id}/deliverables")
def get_client_project_deliverables(project_id: str, db: Session = Depends(get_db)):
    return db.query(models.ProjectDeliverable).filter(models.ProjectDeliverable.project_id == project_id).order_by(models.ProjectDeliverable.id.asc()).all()

@router.put("/projects/{project_id}/deliverables/{deliverable_id}/review")
async def review_mitra_work(project_id: str, deliverable_id: int, payload: DeliverableReviewPayload, db: Session = Depends(get_db)):
    deliverable = db.query(models.ProjectDeliverable).filter(models.ProjectDeliverable.id == deliverable_id, models.ProjectDeliverable.project_id == project_id).first()
    if not deliverable: raise HTTPException(status_code=404)
    deliverable.status = payload.status
    deliverable.feedback = payload.feedback

    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if project:
        project.current_milestone = f"[{datetime.now().strftime('%d/%m %H:%M')}] " + ("✅ Disetujui: " if payload.status == "APPROVED" else "❌ Revisi: ") + deliverable.title
        if payload.status != "APPROVED" and project.status == "MENUNGGU UAT":
            project.status = "SEDANG DIKERJAKAN"
        db.commit()
        if project.mitra_id:
            await notif_manager.send_personal_notification(
                user_id=project.mitra_id, title=f"STATUS KERJA: {payload.status}",
                message=f"Klien mengevaluasi '{deliverable.title}'.", db=db
            )
    else:
        db.commit()
    db.refresh(deliverable)
    return {"status": "success", "data": deliverable}

# =========================================================================
# 3. SISTEM PENAWARAN (BIDDING) - SISI KLIEN
# =========================================================================
@router.get("/projects/{project_id}/bids")
def get_project_bids(project_id: str, db: Session = Depends(get_db)):
    bids = db.query(models.ProjectBid).filter(models.ProjectBid.project_id == project_id).all()
    
    result = []
    for b in bids:
        mitra_prof = db.query(models.MitraProfile).filter(models.MitraProfile.user_id == b.mitra_id).first()
        result.append({
            "id": b.id,
            "mitra_id": b.mitra_id,
            "mitra_name": b.mitra.name,
            "rating": float(mitra_prof.rating) if mitra_prof else 0.0,
            "projects_completed": mitra_prof.projects_completed if mitra_prof else 0,
            "bid_amount": float(b.bid_amount),
            "cover_letter": b.cover_letter,
            "status": b.status,
            "created_at": b.created_at.strftime("%d %b %Y %H:%M")
        })
    return result

@router.post("/bids/{bid_id}/accept")
async def accept_project_bid(bid_id: str, db: Session = Depends(get_db)):
    """Klien menerima tawaran dengan penyesuaian Delta Escrow"""
    bid = db.query(models.ProjectBid).filter(models.ProjectBid.id == bid_id).first()
    if not bid:
        raise HTTPException(status_code=404, detail="Data penawaran tidak ditemukan.")
        
    project = db.query(models.Project).filter(models.Project.id == bid.project_id).first()
    if project.status != "OPEN":
        raise HTTPException(status_code=400, detail="Proyek sudah ditutup atau sedang dikerjakan.")

    client_wallet = db.query(models.Wallet).filter(models.Wallet.user_id == project.client_id).first()
    selisih_harga = Decimal(str(bid.bid_amount)) - project.budget

    if selisih_harga > 0:
        if client_wallet.balance < selisih_harga:
            raise HTTPException(
                status_code=400, 
                detail=f"Saldo tidak cukup. Butuh tambahan Rp {selisih_harga:,.0f} untuk tawaran ini."
            )
        client_wallet.balance -= selisih_harga
        client_wallet.escrow_balance += selisih_harga
        db.add(models.Transaction(
            id=f"TRX-ESC-ADD-{uuid.uuid4().hex[:4].upper()}", 
            user_id=project.client_id, project_id=project.id,
            transaction_type="PENYESUAIAN ESCROW (NAIK)", amount=-selisih_harga, status="SUCCESS"
        ))
    elif selisih_harga < 0:
        refund_amount = abs(selisih_harga)
        client_wallet.escrow_balance -= refund_amount
        client_wallet.balance += refund_amount
        db.add(models.Transaction(
            id=f"TRX-ESC-REF-{uuid.uuid4().hex[:4].upper()}", 
            user_id=project.client_id, project_id=project.id,
            transaction_type="PENGEMBALIAN ESCROW (TURUN)", amount=refund_amount, status="SUCCESS"
        ))

    bid.status = "ACCEPTED"
    db.query(models.ProjectBid).filter(
        models.ProjectBid.project_id == project.id, 
        models.ProjectBid.id != bid_id
    ).update({"status": "REJECTED"})

    project.mitra_id = bid.mitra_id
    project.budget = bid.bid_amount 
    project.status = "SEDANG DIKERJAKAN"
    project.current_milestone = f"Kontrak resmi dimulai dengan {bid.mitra.name}."

    default_milestones = [
        {"title": "Tahap 1: Desain & Arsitektur", "desc": "Penyerahan rancangan."},
        {"title": "Tahap 2: Implementasi Sistem", "desc": "Pengembangan fungsionalitas inti."},
        {"title": "Tahap 3: Hasil Akhir & Dokumentasi", "desc": "Penyelesaian."}
    ]
    for m in default_milestones:
        db.add(models.ProjectDeliverable(
            project_id=project.id, title=m["title"], description=m["desc"], status="PENDING"
        ))

    db.commit()
    await notif_manager.send_personal_notification(
        user_id=bid.mitra_id, title="🎉 PENAWARAN DITERIMA!",
        message=f"Klien menerima penawaran Anda untuk proyek '{project.title}'.", db=db
    )
    return {"status": "success"}