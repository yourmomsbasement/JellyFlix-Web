import Typography from '@mui/material/Typography';
import React, { type FC } from 'react';
import { Link } from 'react-router-dom';

/** The JellyFlix wordmark, linking home. */
const JellyFlixLogo: FC = () => (
    <Typography
        component={Link}
        to='/home'
        aria-label='JellyFlix'
        sx={{
            mr: { xs: 1, md: 3 },
            color: 'primary.main',
            fontSize: { xs: '1.4rem', md: '1.75rem' },
            fontWeight: 900,
            letterSpacing: '-0.02em',
            lineHeight: 1,
            textDecoration: 'none',
            textTransform: 'uppercase',
            // Netflix's wordmark is tall and condensed
            transform: 'scaleY(1.15)',
            whiteSpace: 'nowrap',
            userSelect: 'none'
        }}
    >
        JellyFlix
    </Typography>
);

export default JellyFlixLogo;
