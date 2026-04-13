import { useState } from 'react';
import {
  Box,
  Button,
  Divider,
  Input,
  InputGroup,
  InputRightElement,
  Text,
  VStack,
} from '@chakra-ui/react';
import AvatarPicker from './components/AvatarPicker';
import GuestCard from './components/GuestCard';
import { AVATAR_SEEDS } from './constants';
import { useAuth } from './hooks/useAuth';

const DEFAULT_AVATAR = AVATAR_SEEDS[0];

export default function AuthPage() {
  const { session, isLoading, error, join, refresh, logout } = useAuth();
  const [name, setName]     = useState('');
  const [avatar, setAvatar] = useState<string>(DEFAULT_AVATAR);

  /* ── authenticated view ── */
  if (session) {
    return (
      <Box
        minH="100vh"
        bg="retro.navy"
        display="flex"
        alignItems="center"
        justifyContent="center"
        p={4}
        // subtle pixel grid background
        bgImage="radial-gradient(circle, #2f4580 1px, transparent 1px)"
        bgSize="24px 24px"
      >
        <Box maxW="360px" w="full">
          <GuestCard
            session={session}
            isLoading={isLoading}
            onRefresh={refresh}
            onLogout={logout}
          />
        </Box>
      </Box>
    );
  }

  /* ── join view ── */
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
        maxW="480px"
        w="full"
        bg="retro.cream"
        border="4px solid"
        borderColor="retro.navy"
        boxShadow="10px 10px 0px #B5E18B"
        p={{ base: 5, md: 8 }}
      >
        <VStack spacing={6} align="stretch">

          {/* ── title ── */}
          <VStack spacing={0} align="center">
            <Text
              fontSize={{ base: 'lg', md: 'xl' }}
              color="retro.navy"
              lineHeight="1.8"
              textAlign="center"
            >
              RANDOM
            </Text>
            <Text
              fontSize={{ base: 'lg', md: 'xl' }}
              color="retro.navy"
              lineHeight="1.8"
              textAlign="center"
            >
              CHAT
            </Text>
            {/* pixel underline */}
            <Box mt={2} h="4px" w="full" bg="retro.navy" />
            <Box mt="2px" h="2px" w="full" bg="retro.lime" />
          </VStack>

          {/* ── avatar picker ── */}
          <VStack spacing={2} align="stretch">
            <Text fontSize="2xs" color="retro.navy" letterSpacing="wider">
              ▸ CHOOSE YOUR AVATAR
            </Text>
            <AvatarPicker selected={avatar} onChange={setAvatar} />
          </VStack>

          <Divider borderColor="retro.navy" borderWidth="2px" opacity={1} />

          {/* ── name input ── */}
          <VStack spacing={2} align="stretch">
            <Text fontSize="2xs" color="retro.navy" letterSpacing="wider">
              ▸ YOUR NAME
            </Text>
            <InputGroup>
              <Input
                variant="pixel"
                placeholder="auto-generated if empty"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={24}
                pr="60px"
              />
              {name.length > 0 && (
                <InputRightElement width="auto" pr={2}>
                  <Text
                    fontSize="2xs"
                    color="retro.navy"
                    opacity={0.4}
                    cursor="pointer"
                    onClick={() => setName('')}
                    userSelect="none"
                  >
                    ✕
                  </Text>
                </InputRightElement>
              )}
            </InputGroup>
            <Text fontSize="2xs" color="retro.navy" opacity={0.45} lineHeight="1.8">
              leave blank → we pick one for you
            </Text>
          </VStack>

          {/* ── error ── */}
          {error && (
            <Box
              bg="retro.beige"
              border="3px solid"
              borderColor="retro.navy"
              px={3}
              py={2}
            >
              <Text fontSize="2xs" color="retro.navy" lineHeight="2">
                ⚠ {error}
              </Text>
            </Box>
          )}

          {/* ── join button ── */}
          <Button
            variant="pixel"
            size="lg"
            w="full"
            onClick={() => join(name.trim() || undefined, avatar)}
            isLoading={isLoading}
            loadingText="CONNECTING..."
            fontSize="xs"
            py={7}
            letterSpacing="widest"
          >
            ENTER ROOM
          </Button>

        </VStack>
      </Box>
    </Box>
  );
}
