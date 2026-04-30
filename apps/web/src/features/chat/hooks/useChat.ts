import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  SOCKET_EVENTS,
  type MatchFoundPayload,
  type OfferPayload,
  type AnswerPayload,
  type IceCandidatePayload,
  type ChatMessagePayload,
} from '@videochat/shared';
import type { GuestSession } from '../../auth/types';

const SIGNALING_URL =
  (import.meta as unknown as { env: Record<string, string> }).env.VITE_SIGNALING_URL
  ?? 'http://localhost:3002';

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

export type ChatStatus = 'idle' | 'queued' | 'connecting' | 'chatting' | 'peer_left';

export interface ChatMessage {
  id: string;
  from: 'me' | 'peer';
  text: string;
  ts: number;
}

export function useChat(session: GuestSession) {
  const [status, setStatus]             = useState<ChatStatus>('idle');
  const [messages, setMessages]         = useState<ChatMessage[]>([]);
  const [localStream, setLocalStream]   = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const socketRef            = useRef<Socket | null>(null);
  const pcRef                = useRef<RTCPeerConnection | null>(null);
  const localStreamRef       = useRef<MediaStream | null>(null);
  const roomIdRef            = useRef<string | null>(null);
  // Candidates that arrive before setRemoteDescription is called are buffered
  // here then drained immediately after remote SDP is applied.
  const iceCandidateBuffer   = useRef<RTCIceCandidateInit[]>([]);

  const closePc = useCallback(() => {
    pcRef.current?.close();
    pcRef.current              = null;
    roomIdRef.current          = null;
    iceCandidateBuffer.current = [];
    setRemoteStream(null);
  }, []);

  // Always request fresh stream — never reuse stopped tracks
  const ensureLocalStream = useCallback(async (): Promise<MediaStream> => {
    const existing = localStreamRef.current;
    // If we have a live stream already, reuse it
    if (existing && existing.getTracks().some(t => t.readyState === 'live')) {
      return existing;
    }
    // Otherwise (first call, or stream was killed) request a new one
    console.log('[webrtc] requesting camera/mic…');
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localStreamRef.current = stream;
    setLocalStream(stream);
    console.log('[webrtc] camera/mic ready');
    return stream;
  }, []);

  async function applyCandidate(pc: RTCPeerConnection, candidate: RTCIceCandidateInit) {
    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch {
      // benign: duplicate / malformed candidate
    }
  }

  useEffect(() => {
    const socket = io(SIGNALING_URL, {
      auth:        { token: session.token },
      autoConnect: false,
    });
    socketRef.current = socket;

    // ── MATCH_FOUND ───────────────────────────────────────────────────────────
    socket.on(SOCKET_EVENTS.MATCH_FOUND, async (payload: MatchFoundPayload) => {
      console.log('[webrtc] MATCH_FOUND role=%s room=%s', payload.role, payload.roomId);
      roomIdRef.current          = payload.roomId;
      iceCandidateBuffer.current = [];
      setStatus('connecting');
      setMessages([]);

      // ── 1. Get camera ───────────────────────────────────────────────────────
      let stream: MediaStream | null = null;
      try {
        stream = await ensureLocalStream();
      } catch (err) {
        console.error('[webrtc] camera failed:', err);
        // Continue without media — still attempt the WebRTC connection
      }

      // ── 2. Build peer connection ────────────────────────────────────────────
      const remoteMedia = new MediaStream();
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      pcRef.current = pc;
      console.log('[webrtc] RTCPeerConnection created');

      pc.onicecandidate = ({ candidate }) => {
        if (candidate) {
          console.log('[webrtc] sending ICE candidate');
          socket.emit(SOCKET_EVENTS.ICE_CANDIDATE, {
            roomId: payload.roomId,
            candidate,
          } satisfies IceCandidatePayload);
        }
      };

      pc.ontrack = ({ track }) => {
        console.log('[webrtc] remote track received:', track.kind);
        remoteMedia.addTrack(track);
        setRemoteStream(new MediaStream(remoteMedia.getTracks()));
        setStatus('chatting');
      };

      pc.onconnectionstatechange = () => {
        console.log('[webrtc] connectionState:', pc.connectionState);
        if (pc.connectionState === 'connected') setStatus('chatting');
        if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          closePc();
          setStatus('peer_left');
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.log('[webrtc] iceConnectionState:', pc.iceConnectionState);
        if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
          setStatus('chatting');
        }
        if (pc.iceConnectionState === 'failed') {
          closePc();
          setStatus('peer_left');
        }
      };

      pc.onicegatheringstatechange = () => {
        console.log('[webrtc] iceGatheringState:', pc.iceGatheringState);
      };

      pc.onsignalingstatechange = () => {
        console.log('[webrtc] signalingState:', pc.signalingState);
      };

      // Add local tracks (if camera is available)
      if (stream) {
        stream.getTracks().forEach(t => {
          pc.addTrack(t, stream!);
          console.log('[webrtc] added local track:', t.kind);
        });
      }

      // ── 3. Caller creates the offer ─────────────────────────────────────────
      if (payload.role === 'caller') {
        try {
          console.log('[webrtc] creating offer…');
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          console.log('[webrtc] offer created, emitting to server');
          socket.emit(SOCKET_EVENTS.OFFER, {
            roomId: payload.roomId,
            sdp:    offer,
          } satisfies OfferPayload);
        } catch (err) {
          console.error('[webrtc] createOffer failed:', err);
        }
      }
    });

    // ── OFFER (callee) ────────────────────────────────────────────────────────
    socket.on(SOCKET_EVENTS.OFFER, async (payload: OfferPayload) => {
      console.log('[webrtc] OFFER received, waiting for pc…');
      // Wait up to 5 s for the PC to be created by the MATCH_FOUND handler
      let pc = pcRef.current;
      for (let i = 0; i < 50 && !pc; i++) {
        await new Promise(r => setTimeout(r, 100));
        pc = pcRef.current;
      }
      if (!pc) {
        console.error('[webrtc] OFFER: pc still null after 5 s, giving up');
        return;
      }
      try {
        console.log('[webrtc] setRemoteDescription (offer)');
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));

        // Drain any candidates that arrived before remote SDP was set
        console.log('[webrtc] draining ICE buffer:', iceCandidateBuffer.current.length, 'candidates');
        for (const c of iceCandidateBuffer.current) await applyCandidate(pc, c);
        iceCandidateBuffer.current = [];

        console.log('[webrtc] creating answer…');
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        console.log('[webrtc] answer created, emitting');
        socket.emit(SOCKET_EVENTS.ANSWER, {
          roomId: payload.roomId,
          sdp:    answer,
        } satisfies AnswerPayload);
      } catch (err) {
        console.error('[webrtc] OFFER handler failed:', err);
      }
    });

    // ── ANSWER (caller) ───────────────────────────────────────────────────────
    socket.on(SOCKET_EVENTS.ANSWER, async (payload: AnswerPayload) => {
      console.log('[webrtc] ANSWER received');
      const pc = pcRef.current;
      if (!pc) return;
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));

        console.log('[webrtc] draining ICE buffer after answer:', iceCandidateBuffer.current.length);
        for (const c of iceCandidateBuffer.current) await applyCandidate(pc, c);
        iceCandidateBuffer.current = [];
      } catch (err) {
        console.error('[webrtc] ANSWER handler failed:', err);
      }
    });

    // ── ICE_CANDIDATE ─────────────────────────────────────────────────────────
    socket.on(SOCKET_EVENTS.ICE_CANDIDATE, async (payload: IceCandidatePayload) => {
      const pc = pcRef.current;
      if (!pc || !pc.remoteDescription) {
        iceCandidateBuffer.current.push(payload.candidate);
        return;
      }
      await applyCandidate(pc, payload.candidate);
    });

    // ── PEER_DISCONNECTED ─────────────────────────────────────────────────────
    // Auto-rejoin the queue so the user is immediately matched with someone new
    socket.on(SOCKET_EVENTS.PEER_DISCONNECTED, () => {
      console.log('[webrtc] peer disconnected, rejoining queue');
      closePc();
      setStatus('queued');
      socket.emit(SOCKET_EVENTS.JOIN_QUEUE);
    });

    // ── CHAT_MESSAGE ──────────────────────────────────────────────────────────
    socket.on(SOCKET_EVENTS.CHAT_MESSAGE, (payload: ChatMessagePayload) => {
      setMessages(prev => [
        ...prev,
        { id: `${payload.timestamp}-peer`, from: 'peer', text: payload.text, ts: payload.timestamp },
      ]);
    });

    return () => {
      closePc();
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
      setLocalStream(null);
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const joinQueue = useCallback(async () => {
    const socket = socketRef.current;
    if (!socket) return;
    await ensureLocalStream().catch(err => console.warn('[webrtc] pre-fetch camera failed:', err));
    if (!socket.connected) socket.connect();
    setStatus('queued');
    socket.emit(SOCKET_EVENTS.JOIN_QUEUE);
  }, [ensureLocalStream]);

  const skip = useCallback(() => {
    closePc();
    setStatus('queued');
    socketRef.current?.emit(SOCKET_EVENTS.SKIP);
  }, [closePc]);

  const sendMessage = useCallback((text: string) => {
    const roomId = roomIdRef.current;
    const socket = socketRef.current;
    if (!roomId || !socket) return;
    const ts = Date.now();
    socket.emit(SOCKET_EVENTS.CHAT_MESSAGE, { roomId, text, timestamp: ts } satisfies ChatMessagePayload);
    setMessages(prev => [...prev, { id: `${ts}-me`, from: 'me', text, ts }]);
  }, []);

  const cancelQueue = useCallback(() => {
    socketRef.current?.emit(SOCKET_EVENTS.LEAVE_QUEUE);
    setStatus('idle');
  }, []);

  return {
    status,
    messages,
    localStream,
    remoteStream,
    joinQueue,
    skip,
    sendMessage,
    cancelQueue,
  };
}
