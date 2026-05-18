from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

# Konfigurasi koneksi MySQL. Ganti 'root' dan password sesuai database lokal/server Anda.
MYSQL_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root:root@localhost:3306/etechhub_db")

engine = create_engine(MYSQL_URL, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency untuk injeksi sesi database ke dalam endpoint
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
