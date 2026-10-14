import Box from '@mui/material/Box';
import React, { type FC } from 'react';
import { Link } from 'react-router-dom';

import LanternfishLogo from 'components/branding/LanternfishLogo';

/** The Lanternfish wordmark, linking home. The lure rises above it, into the top bar's padding. */
const AppLogo: FC = () => (
    <Box
        component={Link}
        to='/home'
        aria-label='Lanternfish'
        sx={{ display: 'inline-flex', alignItems: 'center', mr: { xs: 1, md: 3 }, textDecoration: 'none', userSelect: 'none' }}
    >
        <LanternfishLogo height={{ xs: '19px', md: '24px' }} />
    </Box>
);

export default AppLogo;
