# app/core/security.py
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import jwt
import bcrypt
import os
from dotenv import load_dotenv

load_dotenv()

# Konfigurasi JWT
SECRET_KEY = os.getenv("SECRET_KEY", "super-secret-key-yang-sangat-panjang-dan-acak")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # Token berlaku 1 hari (24 Jam)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    # Bcrypt membutuhkan format byte (bukan string biasa) untuk verifikasi
    password_byte_enc = plain_password.encode('utf-8')
    hashed_password_byte_enc = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_byte_enc, hashed_password_byte_enc)

def get_password_hash(password: str) -> str:
    # Mengacak (hash) password dengan salt bawaan bcrypt
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(pwd_bytes, salt)
    return hashed_password.decode('utf-8') # Kembalikan ke string agar bisa masuk ke MySQL

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    
    # Menggunakan datetime.now(timezone.utc) sebagai standar baru
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
        
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt