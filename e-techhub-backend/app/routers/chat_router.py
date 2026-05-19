from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import domain_models as models
from typing import Dict, List
import json
import re
from datetime import datetime

router = APIRouter(prefix="/api/chat", tags=["Chat"])

# ==========================================
# 1. WEBSOCKET CONNECTION MANAGER
# ==========================================
# Kelas ini bertugas mengelola siapa saja yang sedang "online" di ruang chat
class ConnectionManager:
    def __init__(self):
        # Struktur: {"project_id": [websocket1, websocket2]}
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, room_id: str):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        self.active_connections[room_id].append(websocket)

    def disconnect(self, websocket: WebSocket, room_id: str):
        if room_id in self.active_connections:
            self.active_connections[room_id].remove(websocket)
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]

    async def broadcast_to_room(self, message: dict, room_id: str):
        if room_id in self.active_connections:
            for connection in self.active_connections[room_id]:
                await connection.send_text(json.dumps(message))

manager = ConnectionManager()

# ==========================================
# 2. FILTER ANTI-BYPASS (REGEX)
# ==========================================
def check_for_violations(text: str) -> bool:
    # Deteksi nomor telepon (minimal 10 angka berurutan/dipisah strip)
    phone_pattern = re.compile(r'(\+62|62|0)[0-9\- ]{9,13}')
    # Deteksi alamat email
    email_pattern = re.compile(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}')
    
    if phone_pattern.search(text) or email_pattern.search(text):
        return True
    return False

# ==========================================
# 3. ENDPOINT WEBSOCKET
# ==========================================
@router.websocket("/ws/{room_id}/{user_id}")
async def websocket_chat_endpoint(websocket: WebSocket, room_id: str, user_id: str, db: Session = Depends(get_db)):
    await manager.connect(websocket, room_id)
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            raw_text = message_data.get("text", "")

            is_violation = check_for_violations(raw_text)
            
            if is_violation:
                final_text = "⚠️ [SISTEM MEMBLOKIR PESAN]: Dilarang mengirimkan informasi kontak pribadi di luar platform."
                is_system = True
            else:
                final_text = raw_text
                is_system = False

            # Simpan menggunakan room_id
            new_msg = models.ChatMessage(
                room_id=room_id, 
                sender_id=user_id if not is_system else "SYSTEM",
                message_text=final_text,
                is_system_message=is_system
            )
            db.add(new_msg)
            db.commit()

            response_payload = {
                "sender_id": user_id if not is_system else "SYSTEM",
                "text": final_text,
                "is_system_message": is_system,
                "timestamp": datetime.now().strftime('%H:%M')
            }
            await manager.broadcast_to_room(response_payload, room_id)

    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id)
# ==========================================
# 4. ENDPOINT REST: AMBIL RIWAYAT CHAT
# ==========================================
@router.get("/history/{room_id}")
def get_chat_history(room_id: str, db: Session = Depends(get_db)):
    # Query menggunakan room_id
    messages = db.query(models.ChatMessage).filter(models.ChatMessage.room_id == room_id).order_by(models.ChatMessage.created_at.asc()).all()
    # ... (return response sama persis seperti sebelumnya) ...
    return [
        {
            "id": msg.id,
            "sender_id": msg.sender_id,
            "text": msg.message_text,
            "is_system": msg.is_system_message,
            "timestamp": msg.created_at.strftime('%d/%m %H:%M')
        }
        for msg in messages
    ]

@router.get("/inbox/{user_id}")
def get_chat_inbox(user_id: str, db: Session = Depends(get_db)):
    # 1. Cari semua room_id unik yang menyertakan ID user ini
    # (Bisa untuk Mitra mencari NEGO-...-VND123, atau Klien mencari NEGO-USER123-...)
    rooms_query = db.query(models.ChatMessage.room_id).filter(
        models.ChatMessage.room_id.like(f"%{user_id}%")
    ).distinct().all()

    inbox = []
    for (room_id,) in rooms_query:
        # 2. Ambil pesan terakhir untuk dijadikan 'Preview' di list inbox
        last_msg = db.query(models.ChatMessage).filter(
            models.ChatMessage.room_id == room_id
        ).order_by(models.ChatMessage.created_at.desc()).first()
        
        # Ekstrak lawan bicara dari room_id (Asumsi format NEGO-CLIENT_ID-MITRA_ID)
        # Jika bukan format NEGO, tampilkan room_id utuh
        title = room_id
        if room_id.startswith("NEGO-"):
            parts = room_id.split("-")
            if len(parts) >= 3:
                # Menentukan siapa lawan bicaranya
                if user_id == parts[1]:  # Jika yang login Klien, lawan bicaranya Mitra
                    title = f"NEGOSIASI DENGAN MITRA: {parts[2]}"
                else:                    # Jika yang login Mitra, lawan bicaranya Klien
                    title = f"NEGOSIASI DARI KLIEN: {parts[1]}"

        inbox.append({
            "room_id": room_id,
            "title": title,
            "last_message": last_msg.message_text if last_msg else "",
            "timestamp": last_msg.created_at.strftime('%d/%m %H:%M') if last_msg else "",
            "is_system": last_msg.is_system_message if last_msg else False
        })
    
    return inbox