import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { SOCKET_EVENTS } from '@videochat/shared';

dotenv.config();

const PORT = process.env.PORT || 3002;
const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin: process.env.WEB_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// In-memory state (replaced with Redis in Phase 4)
const rooms = new Map<string, Set<string>>();
const socketRoom = new Map<string, string>();

io.on('connection', (socket) => {
  console.log(`[signaling] connected: ${socket.id}`);

  socket.on('disconnect', () => {
    const roomId = socketRoom.get(socket.id);
    if (!roomId) return;
    socketRoom.delete(socket.id);
    const room = rooms.get(roomId);
    if (room) {
      room.delete(socket.id);
      if (room.size === 0) rooms.delete(roomId);
    }
    io.to(roomId).emit(SOCKET_EVENTS.PEER_DISCONNECTED);
  });
});

httpServer.listen(PORT, () => console.log(`[signaling] http://localhost:${PORT}`));