import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

const config: ThemeConfig = { initialColorMode: 'light', useSystemColorMode: false };

const colors = {
  retro: {
    lime:  '#B5E18B',
    cream: '#F0FFC2',
    beige: '#EAE6BC',
    navy:  '#28396C',
  },
};

const fonts = {
  heading: `'Press Start 2P', monospace`,
  body:    `'Press Start 2P', monospace`,
  mono:    `'Press Start 2P', monospace`,
};

const theme = extendTheme({
  config,
  colors,
  fonts,
  styles: {
    global: {
      body: { bg: 'retro.navy', color: 'retro.navy', margin: 0 },
      '*': { boxSizing: 'border-box' },
    },
  },
  components: {
    Button: {
      variants: {
        pixel: {
          bg: 'retro.lime',
          color: 'retro.navy',
          border: '3px solid',
          borderColor: 'retro.navy',
          borderRadius: 0,
          boxShadow: '4px 4px 0px #28396C',
          fontFamily: 'heading',
          fontSize: '2xs',
          letterSpacing: 'wider',
          _hover: {
            bg: 'retro.cream',
            transform: 'translate(2px, 2px)',
            boxShadow: '2px 2px 0px #28396C',
            _disabled: { bg: 'retro.beige', transform: 'none', boxShadow: '4px 4px 0px #28396C' },
          },
          _active: {
            transform: 'translate(4px, 4px)',
            boxShadow: 'none',
          },
          _disabled: {
            bg: 'retro.beige',
            opacity: 0.7,
          },
        },
        'pixel-ghost': {
          bg: 'retro.beige',
          color: 'retro.navy',
          border: '3px solid',
          borderColor: 'retro.navy',
          borderRadius: 0,
          boxShadow: '4px 4px 0px #28396C',
          fontFamily: 'heading',
          fontSize: '2xs',
          letterSpacing: 'wider',
          _hover: {
            bg: 'retro.cream',
            transform: 'translate(2px, 2px)',
            boxShadow: '2px 2px 0px #28396C',
          },
          _active: {
            transform: 'translate(4px, 4px)',
            boxShadow: 'none',
          },
        },
      },
      defaultProps: { variant: 'pixel' },
    },
    Input: {
      variants: {
        pixel: {
          field: {
            bg: 'retro.cream',
            border: '3px solid',
            borderColor: 'retro.navy',
            borderRadius: 0,
            color: 'retro.navy',
            fontFamily: 'body',
            fontSize: '2xs',
            letterSpacing: 'wide',
            _placeholder: { color: 'retro.navy', opacity: 0.4 },
            _focus: {
              borderColor: 'retro.lime',
              boxShadow: '4px 4px 0px #B5E18B',
              outline: 'none',
            },
            _hover: { borderColor: 'retro.lime' },
          },
        },
      },
      defaultProps: { variant: 'pixel' },
    },
  },
});

export default theme;
