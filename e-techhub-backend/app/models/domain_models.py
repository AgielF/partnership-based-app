import enum
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Text, Enum, ForeignKey, 
    DateTime, Boolean, DECIMAL, Table
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

# =========================================================================
# TABEL ASOSIASI (MANY-TO-MANY)
# =========================================================================
project_tags = Table(
    'project_tags',
    Base.metadata,
    Column('project_id', String(50), ForeignKey('projects.id', ondelete="CASCADE")),
    Column('tag_id', Integer, ForeignKey('tags.id', ondelete="CASCADE"))
)

# =========================================================================
# ENTITAS UTAMA (PENGGUNA & PROFIL)
# =========================================================================
class User(Base):
    __tablename__ = "users"
    
    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum('klien', 'mitra', 'admin'), nullable=False)
    avatar_url = Column(String(255), nullable=True) # <-- TAMBAHAN BARU
    
    # Relasi
    mitra_profile = relationship("MitraProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    wallet = relationship("Wallet", back_populates="user", uselist=False, cascade="all, delete-orphan")

class MitraProfile(Base):
    __tablename__ = "mitra_profiles"
    
    user_id = Column(String(50), ForeignKey('users.id', ondelete="CASCADE"), primary_key=True)
    specialty_role = Column(String(100), nullable=False)
    rating = Column(DECIMAL(3, 2), default=0.00)
    hourly_rate_or_fee = Column(String(50))
    
    # --- KOLOM BARU UNTUK FITUR PROFIL NEO-BRUTALIST ---
    avatar_url = Column(String(255), nullable=True)
    portfolio_link = Column(String(255), nullable=True)
    # ---------------------------------------------------
    
    avg_speed_days = Column(Integer, default=0)
    projects_completed = Column(Integer, default=0)
    
    # --- PILAR 1: KYC & KEPATUHAN ---
    kyc_status = Column(Enum('PENDING', 'VERIFIED', 'REJECTED', 'BANNED'), default='PENDING')
    latitude = Column(DECIMAL(10, 8), nullable=True)
    longitude = Column(DECIMAL(11, 8), nullable=True)
    
    user = relationship("User", back_populates="mitra_profile")

class Wallet(Base):
    __tablename__ = "wallets"
    
    user_id = Column(String(50), ForeignKey('users.id', ondelete="CASCADE"), primary_key=True)
    balance = Column(DECIMAL(15, 2), default=0.00) # Saldo yang bisa ditarik/dipakai
    escrow_balance = Column(DECIMAL(15, 2), default=0.00) # Saldo yang ditahan sistem
    
    user = relationship("User", back_populates="wallet")

# =========================================================================
# ENTITAS PROYEK & KEUANGAN
# =========================================================================
class Tag(Base):
    __tablename__ = "tags"
    id = Column(Integer, primary_key=True, autoincrement=True)
    tag_name = Column(String(50), unique=True, nullable=False)

class Project(Base):
    __tablename__ = "projects"
    
    id = Column(String(50), primary_key=True)
    client_id = Column(String(50), ForeignKey('users.id'))
    mitra_id = Column(String(50), ForeignKey('users.id'), nullable=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    service_type = Column(Enum('SOFTWARE/WEB', 'IOT/EMBEDDED', 'SERVIS HARDWARE', 'PERENTALAN'), nullable=False)
    # --- PILAR 3: ARBITRASE (TAMBAH STATUS DISPUTED) ---
    status = Column(Enum('OPEN', 'SEDANG DIKERJAKAN', 'MENUNGGU UAT', 'COMPLETED', 'CANCELLED', 'DISPUTED'), default='OPEN')
    current_milestone = Column(String(255))
    budget = Column(DECIMAL(15, 2), nullable=False)
    deadline_days = Column(Integer)

    # Relasi
    client = relationship("User", foreign_keys=[client_id])
    mitra = relationship("User", foreign_keys=[mitra_id])
    tags = relationship("Tag", secondary=project_tags)
    bids = relationship("ProjectBid", back_populates="project", cascade="all, delete-orphan")

class Transaction(Base):
    __tablename__ = "transactions"
    
    id = Column(String(50), primary_key=True)
    user_id = Column(String(50), ForeignKey('users.id'), nullable=False)
    project_id = Column(String(50), ForeignKey('projects.id', ondelete="SET NULL"), nullable=True)
    transaction_type = Column(String(100), nullable=False)
    amount = Column(DECIMAL(15, 2), nullable=False)
    status = Column(Enum('PENDING', 'SUCCESS', 'FAILED'), default='SUCCESS')
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", foreign_keys=[user_id])
    project = relationship("Project", foreign_keys=[project_id])

class ProjectBid(Base):
    __tablename__ = "project_bids"

    id = Column(String(50), primary_key=True, index=True)
    project_id = Column(String(50), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    mitra_id = Column(String(50), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    bid_amount = Column(DECIMAL(15, 2), nullable=False) 
    cover_letter = Column(Text, nullable=False) 
    status = Column(String(20), default="PENDING", nullable=False) 
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="bids")
    mitra = relationship("User", foreign_keys=[mitra_id])

# =========================================================================
# ENTITAS OPERASIONAL PROYEK (DELIVERABLES, QnA, DROPOFF)
# =========================================================================
class DeliverableStatus(str, enum.Enum):
    PENDING = "PENDING"
    SUBMITTED = "SUBMITTED"
    REVISION_REQUESTED = "REVISION_REQUESTED"
    APPROVED = "APPROVED"

class ProjectDeliverable(Base):
    __tablename__ = "project_deliverables"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    project_id = Column(String(50), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    submission_link = Column(Text, nullable=True)
    status = Column(Enum(DeliverableStatus), default=DeliverableStatus.PENDING, nullable=False)
    feedback = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    project = relationship("Project")

class ProjectQnA(Base):
    __tablename__ = "project_qna"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    project_id = Column(String(50), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String(50), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")

class IotDropoff(Base):
    __tablename__ = "iot_dropoffs"
    
    id = Column(String(50), primary_key=True, index=True)
    project_id = Column(String(50), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    admin_id = Column(String(50), ForeignKey("users.id"), nullable=False)
    device_type = Column(String(100), nullable=False)
    physical_status = Column(String(50), default='MENUNGGU_DIANTAR')
    condition_notes = Column(Text)
    received_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    project = relationship("Project", backref="dropoff_details")
    admin = relationship("User", foreign_keys=[admin_id])

# =========================================================================
# ENTITAS KOMUNIKASI & NOTIFIKASI
# =========================================================================
class ChatMessage(Base):
    __tablename__ = "chat_messages"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    room_id = Column(String(100), nullable=False) 
    sender_id = Column(String(50), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    message_text = Column(Text, nullable=False)
    is_system_message = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    sender = relationship("User")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String(50), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Integer, default=0) # 0 = unread, 1 = read
    created_at = Column(DateTime, default=datetime.utcnow)

# =========================================================================
# ENTITAS KONFIGURASI SISTEM
# =========================================================================
class SystemSetting(Base):
    __tablename__ = "system_settings"
    
    setting_key = Column(String(50), primary_key=True)
    setting_value = Column(String(255), nullable=False)
    description = Column(Text)

