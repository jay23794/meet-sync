import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import { randomUUID } from 'crypto';
import dotenv from 'dotenv';
import { SOCKET_EVENTS, MatchFoundPayload, OfferPayload, AnswerPayload, IceCandidatePayload } from '@videochat/shared';

dotenv.config();

// ─── HTTP + Socket.io setup ───────────────────────────────────────────────────

const PORT = process.env.PORT || 3002;
const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin: process.env.WEB_URL || true,
    methods: ['GET', 'POST'],
  },
});

// ─── In-memory state ──────────────────────────────────────────────────────────
// (Replace with Redis in the future for multi-instance support)

// Ordered list of socket IDs waiting to be matched with someone
const waitingQueue: string[] = [];

// roomId → { caller: socketId, callee: socketId }
// Once two peers are matched, they share a roomId for the duration of their session
const rooms = new Map<string, { caller: string; callee: string }>();

// socketId → roomId  (reverse lookup so we can find a socket's room quickly)
const socketToRoom = new Map<string, string>();

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Remove a socket from the waiting queue (if it is in there).
 * Safe to call even if the socket is not currently queued.
 */
function removeFromQueue(socketId: string): void {
  const idx = waitingQueue.indexOf(socketId);
  if (idx !== -1) {
    waitingQueue.splice(idx, 1);
    console.log(`[queue] removed ${socketId} — queue length: ${waitingQueue.length}`);
  }
}

/**
 * Tear down the room that `socketId` belongs to.
 * Notifies the other peer that their partner left, then cleans up all state.
 * Does NOT re-queue either peer — callers decide that themselves.
 *
 * Returns the socketId of the peer who was in the room with us (if any).
 */
function leaveRoom(socketId: string): string | null {
  const roomId = socketToRoom.get(socketId);
  if (!roomId) return null; // socket wasn't in a room

  const room = rooms.get(roomId);
  if (!room) return null;

  // Figure out which peer is the other one
  const peerId = room.caller === socketId ? room.callee : room.caller;

  // Tell the other peer their partner has gone
  io.to(peerId).emit(SOCKET_EVENTS.PEER_DISCONNECTED);

  // Clean up room state for both peers
  socketToRoom.delete(socketId);
  socketToRoom.delete(peerId);
  rooms.delete(roomId);

  // Make the socket leave the Socket.io room so no stale broadcasts reach it
  io.sockets.sockets.get(socketId)?.leave(roomId);
  io.sockets.sockets.get(peerId)?.leave(roomId);

  console.log(`[room] destroyed ${roomId} (triggered by ${socketId})`);
  return peerId;
}

/**
 * Try to match the two oldest people in the queue.
 * If there are fewer than two people waiting, this is a no-op.
 */
function tryMatch(): void {
  if (waitingQueue.length < 2) return;

  // Dequeue the two peers who have been waiting the longest
  const callerId = waitingQueue.shift()!;
  const calleeId = waitingQueue.shift()!;

  // Create a shared room identifier for this session
  const roomId = randomUUID();

  // Persist room state
  rooms.set(roomId, { caller: callerId, callee: calleeId });
  socketToRoom.set(callerId, roomId);
  socketToRoom.set(calleeId, roomId);

  // Join both sockets to the Socket.io room so we can broadcast to them later
  io.sockets.sockets.get(callerId)?.join(roomId);
  io.sockets.sockets.get(calleeId)?.join(roomId);

  // Notify each peer about the match.
  // The CALLER is responsible for creating the WebRTC offer first.
  const callerPayload: MatchFoundPayload = { roomId, peerId: calleeId, role: 'caller' };
  const calleePayload: MatchFoundPayload = { roomId, peerId: callerId, role: 'callee' };

  io.to(callerId).emit(SOCKET_EVENTS.MATCH_FOUND, callerPayload);
  io.to(calleeId).emit(SOCKET_EVENTS.MATCH_FOUND, calleePayload);

  console.log(`[match] ${callerId} (caller) ↔ ${calleeId} (callee) in room ${roomId}`);
}

// ─── Connection handler ───────────────────────────────────────────────────────

io.on('connection', (socket: Socket) => {
  console.log(`[signaling] connected: ${socket.id}`);

  // ── Step 1: Client joins the random-chat queue ──────────────────────────────
  // Both peers must emit this before anything else happens.
  socket.on(SOCKET_EVENTS.JOIN_QUEUE, () => {
    // Ignore duplicate queue joins from the same socket
    if (waitingQueue.includes(socket.id)) {
      console.log(`[queue] ${socket.id} already in queue — ignoring`);
      return;
    }

    // Don't let someone queue while they're already in a room
    if (socketToRoom.has(socket.id)) {
      console.log(`[queue] ${socket.id} is already in a room — ignoring JOIN_QUEUE`);
      return;
    }

    waitingQueue.push(socket.id);
    console.log(`[queue] ${socket.id} joined — queue length: ${waitingQueue.length}`);

    // Immediately try to pair this socket with another waiting peer
    tryMatch();
  });

  // ── Step 2 (optional): Client leaves the queue before being matched ─────────
  socket.on(SOCKET_EVENTS.LEAVE_QUEUE, () => {
    removeFromQueue(socket.id);
  });

  // ── Step 3: Caller sends an SDP offer → relay it to the callee ─────────────
  // Only the caller emits this. The server does NOT inspect the SDP; it just
  // forwards the payload to the other side of the room.
  socket.on(SOCKET_EVENTS.OFFER, (payload: OfferPayload) => {
    const room = rooms.get(payload.roomId);
    if (!room) {
      console.warn(`[offer] room ${payload.roomId} not found — ignoring`);
      return;
    }

    // Make sure the sender is actually the caller for this room
    if (room.caller !== socket.id) {
      console.warn(`[offer] ${socket.id} is not the caller for room ${payload.roomId}`);
      return;
    }

    // Forward the offer to the callee
    console.log(`[offer] relaying from ${socket.id} in room ${payload.roomId}`);
    io.to(room.callee).emit(SOCKET_EVENTS.OFFER, payload);
  });

  // ── Step 4: Callee responds with an SDP answer → relay it to the caller ─────
  socket.on(SOCKET_EVENTS.ANSWER, (payload: AnswerPayload) => {
    const room = rooms.get(payload.roomId);
    if (!room) {
      console.warn(`[answer] room ${payload.roomId} not found — ignoring`);
      return;
    }

    if (room.callee !== socket.id) {
      console.warn(`[answer] ${socket.id} is not the callee for room ${payload.roomId}`);
      return;
    }

    console.log(`[answer] relaying from ${socket.id} in room ${payload.roomId}`);
    io.to(room.caller).emit(SOCKET_EVENTS.ANSWER, payload);
  });

  // ── Step 5: Both peers exchange ICE candidates until P2P path is found ───────
  // Either side can send ICE candidates; we just forward them to whoever is on
  // the other end of the room.
  socket.on(SOCKET_EVENTS.ICE_CANDIDATE, (payload: IceCandidatePayload) => {
    const room = rooms.get(payload.roomId);
    if (!room) {
      console.warn(`[ice] room ${payload.roomId} not found — ignoring`);
      return;
    }

    // Route to the peer on the other side
    const targetId = room.caller === socket.id ? room.callee : room.caller;

    console.log(`[ice] relaying candidate from ${socket.id} → ${targetId}`);
    io.to(targetId).emit(SOCKET_EVENTS.ICE_CANDIDATE, payload);
  });

  // ── Chat messages: relay text to the other peer in the room ─────────────────
  // The server is just a dumb relay here — it does NOT store messages.
  socket.on(SOCKET_EVENTS.CHAT_MESSAGE, (payload: { roomId: string; text: string; timestamp: number }) => {
    const room = rooms.get(payload.roomId);
    if (!room) return;

    const targetId = room.caller === socket.id ? room.callee : room.caller;
    io.to(targetId).emit(SOCKET_EVENTS.CHAT_MESSAGE, payload);
  });

  // ── Step 6a: Peer skips → end session and re-queue the skipper ───────────────
  // The skipper is immediately put back into the queue so they can meet someone
  // new. The skipped peer also receives PEER_DISCONNECTED and can decide on the
  // client side whether to re-queue themselves.
  socket.on(SOCKET_EVENTS.SKIP, () => {
    console.log(`[skip] ${socket.id} skipped their current peer`);

    // Tear down the existing room (notifies the other peer inside)
    leaveRoom(socket.id);

    // Put the skipper back into the queue right away
    waitingQueue.push(socket.id);
    console.log(`[queue] ${socket.id} re-queued after skip — queue length: ${waitingQueue.length}`);

    tryMatch();
  });

  // ── Step 6b: Peer disconnects entirely ───────────────────────────────────────
  // This fires for both intentional tab-closes and unexpected network drops.
  socket.on('disconnect', () => {
    console.log(`[signaling] disconnected: ${socket.id}`);

    // Clean up queue if they were still waiting
    removeFromQueue(socket.id);

    // Clean up room if they were already in a session
    // (leaveRoom notifies the other peer; we do NOT re-queue the remaining peer
    //  here — the client decides whether to call JOIN_QUEUE again)
    leaveRoom(socket.id);
  });
});

// ─── Start server ─────────────────────────────────────────────────────────────

httpServer.listen(PORT, () => {
  console.log(`[signaling] listening on http://localhost:${PORT}`);
});
