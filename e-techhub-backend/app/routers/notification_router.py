from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import domain_models as models
import json

router = APIRouter(prefix="/api/notifications", tags=["Notifications Engine"])

# -------------------------------------------------------------------------
# CONNECTION MANAGER: Melacak perangkat/user yang sedang online secara real-time
# -------------------------------------------------------------------------
class NotificationManager:
    def __init__(self):
        self.active_connections: dict[str, WebSocket] = {}

    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def send_personal_notification(self, user_id: str, title: str, message: str, db: Session):
        # 1. Simpan ke database terlebih dahulu (Persist)
        new_notif = models.Notification(user_id=user_id, title=title, message=message)
        db.add(new_notif)
        db.commit()
        
        # 2. Jika user sedang online/membuka web, tembak langsung via WebSocket
        if user_id in self.active_connections:
            payload = {
                "id": new_notif.id,
                "title": title,
                "message": message,
                "created_at": "Baru Saja"
            }
            try:
                await self.active_connections[user_id].send_text(json.dumps(payload))
            except:
                pass # Amankan jika koneksi terputus mendadak

notif_manager = NotificationManager()

# WebSocket Endpoint untuk Lonceng Notifikasi Frontend
@router.websocket("/ws/{user_id}")
async def websocket_notification_endpoint(websocket: WebSocket, user_id: str):
    await notif_manager.connect(user_id, websocket)
    try:
        while True:
            # Tetap menjaga koneksi tetap hidup (Keep-alive)
            await websocket.receive_text()
    except WebSocketDisconnect:
        notif_manager.disconnect(user_id)

# REST API untuk mengambil riwayat notifikasi yang tersimpan
@router.get("/{user_id}")
def get_user_notifications(user_id: str, db: Session = Depends(get_db)):
    notifs = db.query(models.Notification).filter(
        models.Notification.user_id == user_id
    ).order_by(models.Notification.id.desc()).limit(20).all()
    
    return [{
        "id": n.id,
        "title": n.title,
        "message": n.message,
        "is_read": n.is_read,
        "created_at": n.created_at.strftime('%d/%m %H:%M')
    } for n in notifs]

# REST API untuk menandai semua notifikasi telah dibaca
@router.put("/{user_id}/read-all")
def mark_all_notifications_as_read(user_id: str, db: Session = Depends(get_db)):
    db.query(models.Notification).filter(
        models.Notification.user_id == user_id, 
        models.Notification.is_read == 0
    ).update({"is_read": 1})
    db.commit()
    return {"status": "success"}