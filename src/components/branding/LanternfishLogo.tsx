import Box from '@mui/material/Box';
import type { SxProps, Theme } from '@mui/material/styles';
import React, { type FC } from 'react';

import wordmark from 'assets/img/lanternfish/wordmark.png';

import Lure from './Lure';

interface LanternfishLogoProps {
    /** Height of the lettering, e.g. '24px' or '2vw'. The lure rises above it. */
    height: string | object
    sx?: SxProps<Theme>
}

/**
 * The Lanternfish wordmark: the lettering from the brand artwork, with the lure drawn in the theme's accent color
 * so it glows in every color theme.
 */
const LanternfishLogo: FC<LanternfishLogoProps> = ({ height, sx }) => (
    <Box component='span' role='img' aria-label='Lanternfish' sx={[ { position: 'relative', display: 'inline-block', height, lineHeight: 0 }, ...(Array.isArray(sx) ? sx : [ sx ]) ]}>
        <Box component='img' src={wordmark} alt='' sx={{ height: '100%', width: 'auto', display: 'block' }} />
        {/* Measured from the brand artwork, in units of the lettering's height */}
        <Lure
            sx={{ position: 'absolute', left: 0, top: '-100%', height: '200%', width: 'auto', overflow: 'visible', pointerEvents: 'none' }}
            viewBox='0 -100 120 200'
            base={[ 5.28, 11.06 ]}
            orb={[ 49.25, -43.22 ]}
            orbRadius={11.06}
            stroke={3.52}
            glowRadius={55}
        />
    </Box>
);

export default LanternfishLogo;
