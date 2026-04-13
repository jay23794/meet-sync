import { useEffect, useRef, useState, KeyboardEvent } from 'react';
import {
  Box,
  Button,
  Flex,
  HStack,
  Image,
  Input,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useChat, type ChatStatus, type ChatMessage } from './hooks/useChat';
import { avatarUrl } from '../auth/constants';
import type { GuestSession } from '../auth/types';

// ─── VideoPanel ───────────────────────────────────────────────────────────────
// Wraps a raw <video> element (Chakra has none) and syncs srcObject whenever
// the stream prop changes.

interface VideoPanelProps {
  stream:   MediaStream | null;
  muted?:   boolean;
  label:    string;
  // highlight the border when the P2P connection is live
  isLive?:  boolean;
  // flip camera image so "you" looks like a mirror
  mirror?:  boolean;
}

function VideoPanel({ stream, muted, label, isLive, mirror }: VideoPanelProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Assign the MediaStream to the video element whenever it changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = stream ?? null;
  }, [stream]);

  return (
    <Box
      flex={1}
      border="4px solid"
      borderColor={isLive ? 'retro.lime' : 'retro.navy'}
      boxShadow={isLive ? '6px 6px 0px #B5E18B' : '6px 6px 0px #28396C'}
      bg="retro.navy"
      overflow="hidden"
      position="relative"
      transition="border-color 0.2s, box-shadow 0.2s"
    >
      {/* Live / waiting indicator in the top-right corner */}
      <HStack
        position="absolute"
        top={2}
        right={2}
        spacing={1}
        zIndex={1}
        bg="retro.navy"
        px={2}
        py="2px"
        border="2px solid"
        borderColor={isLive ? 'retro.lime' : 'retro.beige'}
      >
        <Box
          w="6px"
          h="6px"
          bg={isLive ? 'retro.lime' : 'retro.beige'}
          border="1px solid"
          borderColor="retro.navy"
        />
        <Text fontSize="2xs" color={isLive ? 'retro.lime' : 'retro.beige'}>
          {isLive ? 'LIVE' : 'WAIT'}
        </Text>
      </HStack>

      {/* The actual video element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        style={{
          width:        '100%',
          height:       '100%',
          objectFit:    'cover',
          display:      'block',
          background:   '#28396C',
          // Mirror local preview so it feels natural
          transform:    mirror ? 'scaleX(-1)' : 'none',
          // Pixelated upscale keeps the retro feel on small video sizes
          imageRendering: 'pixelated',
        }}
      />

      {/* Label banner at the bottom */}
      <Box
        position="absolute"
        bottom={0}
        left={0}
        right={0}
        bg="retro.navy"
        borderTop="3px solid"
        borderColor="retro.beige"
        px={3}
        py="4px"
      >
        <Text fontSize="2xs" color="retro.cream" letterSpacing="wider">
          {label}
        </Text>
      </Box>
    </Box>
  );
}

// ─── BlinkDots ────────────────────────────────────────────────────────────────
// Simple animated "..." indicator for the searching / connecting states.

function BlinkDots() {
  const [dots, setDots] = useState('.');
  useEffect(() => {
    const id = setInterval(() => {
      setDots(d => (d.length >= 3 ? '.' : d + '.'));
    }, 400);
    return () => clearInterval(id);
  }, []);
  return (
    <Text as="span" color="retro.lime" fontFamily="heading" fontSize="xs">
      {dots}
    </Text>
  );
}

// ─── StatusScreen ─────────────────────────────────────────────────────────────
// Shown when status is 'idle', 'queued', or 'connecting' — before the full
// chat layout appears.

interface StatusScreenProps {
  status:      ChatStatus;
  session:     GuestSession;
  onStart:     () => void;
  onCancel:    () => void;
  onLeave:     () => void;
}

function StatusScreen({ status, session, onStart, onCancel, onLeave }: StatusScreenProps) {
  return (
    <Box
      minH="100vh"
      bg="retro.navy"
      display="flex"
      alignItems="center"
      justifyContent="center"
      p={4}
      bgImage="radial-gradient(circle, #2f4580 1px, transparent 1px)"
      bgSize="24px 24px"
    >
      <Box
        w="full"
        maxW="400px"
        bg="retro.cream"
        border="4px solid"
        borderColor="retro.navy"
        boxShadow="10px 10px 0px #B5E18B"
        p={{ base: 6, md: 8 }}
      >
        <VStack spacing={6} align="center">

          {/* Pixel underline title */}
          <VStack spacing={0} align="center" w="full">
            <Text fontSize="xl" color="retro.navy" lineHeight="1.8" textAlign="center">
              RANDOM CHAT
            </Text>
            <Box mt={2} h="4px" w="full" bg="retro.navy" />
            <Box mt="2px" h="2px" w="full" bg="retro.lime" />
          </VStack>

          {/* Avatar + name */}
          <HStack spacing={3} align="center">
            <Box
              border="3px solid"
              borderColor="retro.navy"
              boxShadow="3px 3px 0px #28396C"
              bg="retro.beige"
              p="4px"
              w="52px"
              h="52px"
              flexShrink={0}
            >
              <Image
                src={avatarUrl(session.avatar)}
                alt="avatar"
                w="full"
                h="full"
                style={{ imageRendering: 'pixelated' }}
              />
            </Box>
            <VStack spacing={0} align="start">
              <Text fontSize="2xs" color="retro.navy" letterSpacing="wider">
                {session.name}
              </Text>
              <Text fontSize="2xs" color="retro.navy" opacity={0.45}>
                {session.guestId}
              </Text>
            </VStack>
          </HStack>

          <Box w="full" h="3px" bg="retro.navy" />

          {/* Status-specific content */}
          {status === 'idle' && (
            <VStack spacing={4} w="full" align="stretch">
              <Text fontSize="2xs" color="retro.navy" opacity={0.6} textAlign="center" lineHeight="2">
                ▸ PRESS THE BUTTON TO MEET
                {'\n'}A RANDOM STRANGER
              </Text>
              <Button
                variant="pixel"
                size="lg"
                w="full"
                onClick={onStart}
                fontSize="xs"
                py={7}
                letterSpacing="widest"
              >
                FIND STRANGER
              </Button>
              <Button variant="pixel-ghost" size="sm" w="full" onClick={onLeave}>
                LOGOUT
              </Button>
            </VStack>
          )}

          {status === 'queued' && (
            <VStack spacing={5} w="full" align="center">
              <Box
                w="full"
                bg="retro.beige"
                border="3px solid"
                borderColor="retro.navy"
                p={4}
                textAlign="center"
              >
                <Text fontSize="2xs" color="retro.navy" lineHeight="2.5">
                  SEARCHING FOR A STRANGER
                </Text>
                <BlinkDots />
              </Box>
              <Button variant="pixel-ghost" size="sm" w="full" onClick={onCancel}>
                CANCEL
              </Button>
            </VStack>
          )}

          {status === 'connecting' && (
            <VStack spacing={5} w="full" align="center">
              <Box
                w="full"
                bg="retro.beige"
                border="3px solid"
                borderColor="retro.lime"
                boxShadow="4px 4px 0px #B5E18B"
                p={4}
                textAlign="center"
              >
                <Text fontSize="2xs" color="retro.navy" lineHeight="2.5">
                  STRANGER FOUND — CONNECTING
                </Text>
                <BlinkDots />
              </Box>
            </VStack>
          )}

        </VStack>
      </Box>
    </Box>
  );
}

// ─── ChatLog ──────────────────────────────────────────────────────────────────
// Scrollable message history.

interface ChatLogProps {
  messages: ChatMessage[];
}

function ChatLog({ messages }: ChatLogProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <Box
      flex={1}
      overflowY="auto"
      px={3}
      py={3}
      display="flex"
      flexDirection="column"
      gap={2}
      // Custom minimal scrollbar to keep the pixel look
      sx={{
        '&::-webkit-scrollbar':       { width: '6px' },
        '&::-webkit-scrollbar-track': { bg: 'retro.beige' },
        '&::-webkit-scrollbar-thumb': { bg: 'retro.navy' },
      }}
    >
      {messages.length === 0 && (
        <Text
          fontSize="2xs"
          color="retro.navy"
          opacity={0.4}
          textAlign="center"
          mt={4}
          lineHeight={2}
        >
          ▸ SAY HELLO!
        </Text>
      )}

      {messages.map(msg => (
        <Box
          key={msg.id}
          alignSelf={msg.from === 'me' ? 'flex-end' : 'flex-start'}
          maxW="80%"
          bg={msg.from === 'me' ? 'retro.lime' : 'retro.beige'}
          border="3px solid"
          borderColor="retro.navy"
          boxShadow={msg.from === 'me' ? '3px 3px 0px #28396C' : '3px 3px 0px #B5E18B'}
          px={3}
          py={2}
        >
          <Text
            fontSize="2xs"
            color="retro.navy"
            opacity={0.5}
            mb="2px"
            letterSpacing="wider"
          >
            {msg.from === 'me' ? 'YOU' : 'STRANGER'}
          </Text>
          <Text fontSize="2xs" color="retro.navy" lineHeight={1.8} wordBreak="break-word">
            {msg.text}
          </Text>
        </Box>
      ))}

      {/* Invisible sentinel for auto-scroll */}
      <div ref={bottomRef} />
    </Box>
  );
}

// ─── ChatPage ─────────────────────────────────────────────────────────────────

interface ChatPageProps {
  session: GuestSession;
  onLeave: () => void;
}

export default function ChatPage({ session, onLeave }: ChatPageProps) {
  const [inputText, setInputText] = useState('');

  const {
    status,
    messages,
    localStream,
    remoteStream,
    joinQueue,
    skip,
    sendMessage,
    cancelQueue,
  } = useChat(session);

  function handleSend() {
    const text = inputText.trim();
    if (!text) return;
    sendMessage(text);
    setInputText('');
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // ── Pre-connection states: idle / queued / connecting ──────────────────────
  if (status === 'idle' || status === 'queued' || status === 'connecting') {
    return (
      <StatusScreen
        status={status}
        session={session}
        onStart={joinQueue}
        onCancel={cancelQueue}
        onLeave={onLeave}
      />
    );
  }

  // ── Active session: chatting + peer_left ───────────────────────────────────
  const isLive = status === 'chatting';

  return (
    <Flex
      direction="column"
      h="100vh"
      bg="retro.navy"
      overflow="hidden"
    >
      {/* ── Header bar ──────────────────────────────────────────────────────── */}
      <Flex
        as="header"
        align="center"
        justify="space-between"
        bg="retro.cream"
        border="4px solid"
        borderColor="retro.navy"
        borderTop="none"
        borderLeft="none"
        borderRight="none"
        px={{ base: 3, md: 5 }}
        py={3}
        gap={3}
        flexShrink={0}
      >
        {/* Title + status dot */}
        <HStack spacing={2}>
          <Box w="10px" h="10px" bg={isLive ? 'retro.lime' : 'retro.beige'} border="2px solid" borderColor="retro.navy" />
          <Text fontSize={{ base: '2xs', md: 'xs' }} color="retro.navy" letterSpacing="widest">
            RANDOM CHAT
          </Text>
        </HStack>

        {/* Action buttons */}
        <HStack spacing={2}>
          <Button
            variant="pixel"
            size="sm"
            onClick={status === 'peer_left' ? joinQueue : skip}
            fontSize="2xs"
            px={4}
          >
            {status === 'peer_left' ? '▸ NEXT' : '▸ SKIP'}
          </Button>
          <Button
            variant="pixel-ghost"
            size="sm"
            onClick={onLeave}
            fontSize="2xs"
            px={4}
          >
            × LEAVE
          </Button>
        </HStack>
      </Flex>

      {/* ── Peer-left banner ────────────────────────────────────────────────── */}
      {status === 'peer_left' && (
        <Box
          bg="retro.beige"
          border="3px solid"
          borderColor="retro.navy"
          borderTop="none"
          px={4}
          py={2}
          textAlign="center"
          flexShrink={0}
        >
          <Text fontSize="2xs" color="retro.navy" letterSpacing="wider">
            ▸ STRANGER HAS DISCONNECTED — PRESS NEXT OR LEAVE
          </Text>
        </Box>
      )}

      {/* ── Main area: videos left, chat right ──────────────────────────────── */}
      <Flex
        flex={1}
        direction={{ base: 'column', md: 'row' }}
        overflow="hidden"
        gap="4px"
        p="4px"
      >

        {/* ── Video column ──────────────────────────────────────────────────── */}
        <Flex
          direction="column"
          w={{ base: '100%', md: '55%' }}
          h={{ base: '45%', md: 'auto' }}
          gap="4px"
          flexShrink={0}
        >
          {/* Stranger's video (larger / primary) */}
          <VideoPanel
            stream={remoteStream}
            label="STRANGER"
            isLive={isLive}
          />

          {/* Local preview (smaller) */}
          <VideoPanel
            stream={localStream}
            muted
            mirror
            label={`YOU — ${session.name}`}
            isLive={!!localStream}
          />
        </Flex>

        {/* ── Chat column ───────────────────────────────────────────────────── */}
        <Flex
          direction="column"
          flex={1}
          bg="retro.cream"
          border="4px solid"
          borderColor="retro.navy"
          overflow="hidden"
        >

          {/* Chat header */}
          <Box
            bg="retro.beige"
            borderBottom="3px solid"
            borderColor="retro.navy"
            px={3}
            py={2}
            flexShrink={0}
          >
            <Text fontSize="2xs" color="retro.navy" letterSpacing="widest">
              ▸ CHAT
            </Text>
          </Box>

          {/* Scrollable message list */}
          <ChatLog messages={messages} />

          {/* Message input + send button */}
          <Flex
            as="footer"
            borderTop="3px solid"
            borderColor="retro.navy"
            p={2}
            gap={2}
            flexShrink={0}
            bg="retro.cream"
          >
            <Input
              variant="pixel"
              placeholder="say something..."
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={300}
              flex={1}
              fontSize="2xs"
              isDisabled={status !== 'chatting'}
            />
            <Button
              variant="pixel"
              size="md"
              onClick={handleSend}
              isDisabled={status !== 'chatting' || !inputText.trim()}
              fontSize="2xs"
              px={5}
              flexShrink={0}
            >
              SEND
            </Button>
          </Flex>

        </Flex>
      </Flex>
    </Flex>
  );
}
