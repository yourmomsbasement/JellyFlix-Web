import Box from '@mui/material/Box';
import React, { type FC } from 'react';

/** JellyFlix's red "J", sized like a Material icon. */
const JellyFlixIcon: FC = () => (
    <Box
        component='span'
        aria-hidden
        sx={{
            display: 'inline-flex',
            justifyContent: 'center',
            width: 24,
            color: 'primary.main',
            fontSize: '1.6rem',
            fontWeight: 900,
            lineHeight: 1,
            transform: 'scaleY(1.15)'
        }}
    >
        J
    </Box>
);

export default JellyFlixIcon;
