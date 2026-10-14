import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import React, { type FC } from 'react';
import { Link } from 'react-router-dom';

/** The Lanternfish wordmark, linking home: the glowing lure (in the theme's accent) and the name. */
const LanternfishLogo: FC = () => (
    <Box
        component={Link}
        to='/home'
        aria-label='Lanternfish'
        sx={{
            display: 'inline-flex',
            alignItems: 'flex-end',
            gap: '0.15em',
            mr: { xs: 1, md: 3 },
            color: 'text.primary',
            fontSize: { xs: '1.3rem', md: '1.6rem' },
            lineHeight: 1,
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            userSelect: 'none'
        }}
    >
        <Box
            aria-hidden
            sx={{
                display: 'flex',
                width: '0.7em',
                height: '1.05em',
                color: 'primary.main',
                filter: 'drop-shadow(0 0 0.18em currentColor)'
            }}
        >
            <svg viewBox='0 0 20 30' width='100%' height='100%' fill='none'>
                <path d='M3 30 C3 13 8 6 14 6' stroke='currentColor' strokeWidth='2.4' strokeLinecap='round' />
                <circle cx='15' cy='6' r='4.6' fill='currentColor' />
                <circle cx='13.6' cy='4.6' r='1.5' fill='#fff' fillOpacity='0.85' />
            </svg>
        </Box>
        <Typography component='span' sx={{ font: 'inherit', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Lanternfish
        </Typography>
    </Box>
);

export default LanternfishLogo;
