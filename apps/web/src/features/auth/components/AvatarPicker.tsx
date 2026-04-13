import { Box, Grid, Image, Text } from '@chakra-ui/react';
import { AVATAR_SEEDS, avatarUrl } from '../constants';

interface AvatarPickerProps {
  selected: string;
  onChange: (seed: string) => void;
}

export default function AvatarPicker({ selected, onChange }: AvatarPickerProps) {
  return (
    <Grid templateColumns="repeat(6, 1fr)" gap={2}>
      {AVATAR_SEEDS.map((seed) => {
        const isSelected = seed === selected;
        return (
          <Box
            key={seed}
            onClick={() => onChange(seed)}
            cursor="pointer"
            position="relative"
            border="3px solid"
            borderColor={isSelected ? 'retro.lime' : 'retro.navy'}
            bg={isSelected ? 'retro.lime' : 'retro.beige'}
            boxShadow={isSelected ? '4px 4px 0px #B5E18B' : '3px 3px 0px #28396C'}
            p="6px"
            transition="box-shadow 0.05s, transform 0.05s"
            _hover={{
              borderColor: 'retro.lime',
              transform: 'translate(-2px, -2px)',
              boxShadow: '6px 6px 0px #28396C',
            }}
            _active={{ transform: 'translate(2px, 2px)', boxShadow: 'none' }}
            title={seed}
          >
            <Image
              src={avatarUrl(seed)}
              alt={seed}
              w="full"
              h="auto"
              display="block"
              style={{ imageRendering: 'pixelated' }}
            />
            {isSelected && (
              <Box
                position="absolute"
                bottom="2px"
                right="2px"
                w="6px"
                h="6px"
                bg="retro.navy"
              />
            )}
          </Box>
        );
      })}
    </Grid>
  );
}
