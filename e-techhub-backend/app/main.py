from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import engine, Base

# Import semua router
from app.routers import admin_router, client_router, mitra_router, auth_router, chat_router
from app.routers import notification_router

from fastapi.staticfiles import StaticFiles

# Otomatis membuat tabel jika belum ada di database
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="E-TechHub API Backend",
    description="API untuk Platform On-Demand O2O IT",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(admin_router.router)
app.include_router(client_router.router)
app.include_router(mitra_router.router)
app.include_router(chat_router.router)
app.include_router(notification_router.router)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/")
def health_check():
    return {"status": "Sistem API E-TechHub Beroperasi Normal", "code": 200}
