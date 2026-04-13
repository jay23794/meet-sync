import { Box, HStack, Image, Text, VStack, Button } from '@chakra-ui/react';
import { avatarUrl } from '../constants';
import type { GuestSession } from '../types';

interface GuestCardProps {
  session: GuestSession;
  isLoading: boolean;
  onRefresh: () => void;
  onLogout: () => void;
}

export default function GuestCard({ session, isLoading, onRefresh, onLogout }: GuestCardProps) {
  return (
    <Box
      bg="retro.cream"
      border="4px solid"
      borderColor="retro.navy"
      boxShadow="8px 8px 0px #28396C"
      p={6}
      w="full"
    >
      <VStack spacing={5} align="center">
        {/* Avatar */}
        <Box
          border="4px solid"
          borderColor="retro.navy"
          boxShadow="4px 4px 0px #28396C"
          bg="retro.beige"
          p={2}
          w="96px"
          h="96px"
        >
          <Image
            src={avatarUrl(session.avatar)}
            alt="avatar"
            w="full"
            h="full"
            style={{ imageRendering: 'pixelated' }}
          />
        </Box>

        {/* Name */}
        <VStack spacing={1}>
          <Text fontSize="xs" color="retro.navy" textAlign="center" lineHeight="2">
            {session.name}
          </Text>
          <Text fontSize="2xs" color="retro.navy" opacity={0.5} textAlign="center">
            {session.guestId}
          </Text>
        </VStack>

        {/* Status indicator */}
        <HStack spacing={2} align="center">
          <Box w="8px" h="8px" bg="retro.lime" border="2px solid" borderColor="retro.navy" />
          <Text fontSize="2xs" color="retro.navy">
            CONNECTED
          </Text>
        </HStack>

        {/* Actions */}
        <HStack spacing={3} w="full">
          <Button
            variant="pixel"
            size="sm"
            flex={1}
            onClick={onRefresh}
            isLoading={isLoading}
            loadingText="..."
          >
            REFRESH
          </Button>
          <Button
            variant="pixel-ghost"
            size="sm"
            flex={1}
            onClick={onLogout}
            isDisabled={isLoading}
          >
            LEAVE
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
}
