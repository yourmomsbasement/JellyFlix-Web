import Box from '@mui/material/Box';
import type { SxProps, Theme } from '@mui/material/styles';
import React, { type FC } from 'react';

import Lure from './Lure';

/**
 * The Lanternfish mark from the app icon: the L, with its lure in the theme's accent color. Sized by its width, like
 * a Material icon.
 */
const LanternfishMark: FC<{ size?: string | number, glow?: boolean, sx?: SxProps<Theme> }> = ({ size = 24, glow = false, sx }) => (
    <Box component='span' aria-hidden sx={[ { position: 'relative', display: 'inline-block', width: size, height: size, lineHeight: 0, flexShrink: 0 }, ...(Array.isArray(sx) ? sx : [ sx ]) ]}>
        {/* Coordinates from the 512px app icon, cropped to the mark */}
        <Box component='svg' viewBox='70 80 350 350' sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', color: 'text.primary' }}>
            <path d='M88 155 H158 V358 H263 V415 H88 Z' fill='currentColor' />
        </Box>
        <Lure
            viewBox='70 80 350 350'
            sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}
            base={[ 194.5, 343 ]}
            orb={[ 358, 138 ]}
            orbRadius={41}
            stroke={14}
            glowRadius={glow ? 170 : 0}
        />
    </Box>
);

export default LanternfishMark;
