# app/routers/auth_router.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import uuid

from app.core.database import get_db
from app.core.security import get_password_hash, verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from datetime import timedelta
from app.models import domain_models as models
from app.schemas import auth_schemas as schemas

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register")
def register_user(user: schemas.UserRegister, db: Session = Depends(get_db)):
    # 1. Cek apakah email sudah terdaftar
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email sudah terdaftar")
    
    # 2. Generate ID Unik berdasarkan Role (Contoh: USER-ABCD123 atau VND-XYZ987)
    prefix = "VND" if user.role.lower() == "mitra" else "USER"
    unique_id = f"{prefix}-{uuid.uuid4().hex[:8].upper()}"
    
    # 3. Hash Password
    hashed_pwd = get_password_hash(user.password)
    
    # 4. Simpan ke Database
    new_user = models.User(
        id=unique_id,
        name=user.name,
        email=user.email,
        password_hash=hashed_pwd,
        role=user.role.lower()
    )
    db.add(new_user)
    
    # Jika role adalah mitra, buatkan profil kosong di tabel mitra_profiles
    if user.role.lower() == "mitra":
        new_mitra_profile = models.MitraProfile(
            user_id=unique_id,
            specialty_role="General IT Vendor" # Default, bisa diubah user nanti
        )
        db.add(new_mitra_profile)
        
    db.commit()
    db.refresh(new_user)
    
    return {"status": "success", "message": "Akun berhasil dibuat", "user_id": unique_id}

@router.post("/login", response_model=schemas.Token)
def login_user(credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    # 1. Cari user berdasarkan email
    user = db.query(models.User).filter(models.User.email == credentials.email).first()
    
    # 2. Verifikasi User Exists & Password Cocok
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email atau kata sandi salah",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 3. Buat JWT Token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role, "user_id": user.id},
        expires_delta=access_token_expires
    )
    
    # 4. Kembalikan token ke React
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "user_id": user.id,
        "name": user.name
    }