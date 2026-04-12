export const SOCKET_EVENTS = {
  JOIN_QUEUE:        'join_queue',
  LEAVE_QUEUE:       'leave_queue',
  MATCH_FOUND:       'match_found',
  PEER_DISCONNECTED: 'peer_disconnected',
  OFFER:             'offer',
  ANSWER:            'answer',
  ICE_CANDIDATE:     'ice_candidate',
  CHAT_MESSAGE:      'chat_message',
} as const;

export type SocketEvent = typeof SOCKET_EVENTS[keyof typeof SOCKET_EVENTS];

export interface MatchFoundPayload {
  roomId: string;
  peerId: string;
  initiator: boolean;
}

export interface OfferPayload {
  roomId: string;
  sdp: RTCSessionDescriptionInit;
}

export interface AnswerPayload {
  roomId: string;
  sdp: RTCSessionDescriptionInit;
}

export interface IceCandidatePayload {
  roomId: string;
  candidate: RTCIceCandidateInit;
}

export interface ChatMessagePayload {
  roomId: string;
  text: string;
  timestamp: number;
}

export interface ApiResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface HealthResponse {
  status: 'ok';
  uptime: number;
  timestamp: string;
}
// ─── Auth shapes ──────────────────────────────────────────────────────────────
 
// This is what gets encoded inside the JWT.
// Both the API (signs it) and signaling server (verifies it) share this type.
export interface GuestTokenPayload {
  guestId: string;    // unique ID for this guest e.g. "guest_a1b2c3"
  iat?: number;       // issued at (added automatically by JWT)
  exp?: number;       // expiry (added automatically by JWT)
}
 
export interface GuestAuthResponse {
  token: string;      // the JWT string
  guestId: string;    // so the frontend knows its own ID without decoding JWT
}