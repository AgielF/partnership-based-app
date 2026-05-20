
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
# Import tipe data dari SQLAlchemy (Perhatikan DateTime menggunakan huruf kapital)
from sqlalchemy import Column, String, Integer, DECIMAL, ForeignKey, Enum, Text, Table, DateTime, Boolean
# Import modul waktu bawaan Python
from datetime import datetime


import enum
from sqlalchemy import Column, String, Integer, Text, Enum, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


# Tabel Asosiasi Many-to-Many
project_tags = Table(
    'project_tags',
    Base.metadata,
    Column('project_id', String(50), ForeignKey('projects.id')),
    Column('tag_id', Integer, ForeignKey('tags.id'))
)

class User(Base):
    __tablename__ = "users"
    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum('klien', 'mitra', 'admin'), nullable=False)
    
    # Relasi
    mitra_profile = relationship("MitraProfile", back_populates="user", uselist=False)

class MitraProfile(Base):
    __tablename__ = "mitra_profiles"
    user_id = Column(String(50), ForeignKey('users.id', ondelete="CASCADE"), primary_key=True)
    specialty_role = Column(String(100), nullable=False)
    rating = Column(DECIMAL(3, 2), default=0.00)
    hourly_rate_or_fee = Column(String(50))
    avg_speed_days = Column(Integer, default=0)
    projects_completed = Column(Integer, default=0)
    
    # --- PILAR 1: KYC & KEPATUHAN ---
    kyc_status = Column(Enum('PENDING', 'VERIFIED', 'REJECTED', 'BANNED'), default='PENDING')
    latitude = Column(DECIMAL(10, 8), nullable=True)
    longitude = Column(DECIMAL(11, 8), nullable=True)
    
    user = relationship("User", back_populates="mitra_profile")

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

class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(String(50), primary_key=True)
    user_id = Column(String(50), ForeignKey('users.id'), nullable=False)
    project_id = Column(String(50), ForeignKey('projects.id'), nullable=True)
    transaction_type = Column(String(100), nullable=False)
    amount = Column(DECIMAL(15, 2), nullable=False)
    status = Column(Enum('PENDING', 'SUCCESS', 'FAILED'), default='SUCCESS')
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relasi untuk kemudahan query
    user = relationship("User", foreign_keys=[user_id])
    project = relationship("Project", foreign_keys=[project_id])

class Wallet(Base):
    __tablename__ = "wallets"
    user_id = Column(String(50), ForeignKey('users.id', ondelete="CASCADE"), primary_key=True)
    balance = Column(DECIMAL(15, 2), default=0.00) # Saldo yang bisa ditarik/dipakai
    escrow_balance = Column(DECIMAL(15, 2), default=0.00) # Saldo yang sedang ditahan sistem
    
    user = relationship("User", backref="wallet")

# --- PILAR 5: KONFIGURASI SISTEM ---
class SystemSetting(Base):
    __tablename__ = "system_settings"
    setting_key = Column(String(50), primary_key=True)
    setting_value = Column(String(255), nullable=False)
    description = Column(Text)

# Tambahkan di bagian bawah file domain_models.py
class ChatMessage(Base):
    __tablename__ = "chat_messages"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    # Hapus project_id, ganti dengan room_id (TIDAK ADA ForeignKey ke project lagi)
    room_id = Column(String(100), nullable=False) 
    sender_id = Column(String(50), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    message_text = Column(Text, nullable=False)
    is_system_message = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relasi project dihapus, sisa relasi ke sender saja
    sender = relationship("User")

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

    # Relasi
    project = relationship("Project", backref="dropoff_details")
    admin = relationship("User")


# 1. Definisi Enum Status Progres Tingkat Industri
class DeliverableStatus(str, enum.Enum):
    PENDING = "PENDING"
    SUBMITTED = "SUBMITTED"
    REVISION_REQUESTED = "REVISION_REQUESTED"
    APPROVED = "APPROVED"

# 2. Model Objek Data Bukti Kerja
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

    # Relasi balik ke entitas Project utama
    project = relationship("Project")


class ProjectQnA(Base):
    __tablename__ = "project_qna"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    project_id = Column(String(50), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String(50), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relasi ORM
    user = relationship("User")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String(50), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Integer, default=0) # 0 = unread, 1 = read
    created_at = Column(DateTime, default=datetime.utcnow)