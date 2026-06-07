from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List
import logging

# Configure logger
logger = logging.getLogger("uvicorn")

watch_party_app = APIRouter()

class ConnectionManager:
    def __init__(self):
        # Maps room_id -> list of active WebSocket connections
        self.rooms: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, room_id: str):
        await websocket.accept()
        if room_id not in self.rooms:
            self.rooms[room_id] = []
        self.rooms[room_id].append(websocket)
        logger.info(f"[WatchParty] Client connected to room {room_id}. Total peers: {len(self.rooms[room_id])}")

    def disconnect(self, websocket: WebSocket, room_id: str):
        if room_id in self.rooms:
            if websocket in self.rooms[room_id]:
                self.rooms[room_id].remove(websocket)
                logger.info(f"[WatchParty] Client disconnected from room {room_id}. Remaining peers: {len(self.rooms[room_id])}")
            if not self.rooms[room_id]:
                del self.rooms[room_id]
                logger.info(f"[WatchParty] Room {room_id} closed as it has no active peers.")

    async def broadcast(self, message: dict, room_id: str, sender: WebSocket):
        if room_id in self.rooms:
            for connection in self.rooms[room_id]:
                if connection != sender:
                    try:
                        await connection.send_json(message)
                    except Exception as e:
                        logger.error(f"[WatchParty] Failed to broadcast message to a peer in room {room_id}: {e}")

manager = ConnectionManager()

@watch_party_app.websocket("/MovieSphere/watch-party/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str):
    await manager.connect(websocket, room_id)
    try:
        while True:
            # Expecting JSON payloads containing WebRTC signaling info
            # (SDP offers/answers, ICE candidates) or video sync status updates
            data = await websocket.receive_json()
            await manager.broadcast(data, room_id, sender=websocket)
    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id)
    except Exception as e:
        logger.error(f"[WatchParty] Error in room {room_id}: {e}")
        manager.disconnect(websocket, room_id)
