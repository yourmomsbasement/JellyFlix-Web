import Box from '@mui/material/Box';
import React, { type FC, type PropsWithChildren } from 'react';

import { TILE_GAP } from '../styles';

interface TvRowProps {
    title?: string
}

/**
 * A row of tiles that slides sideways as the remote moves through it. See useTvNavigation for the data attributes.
 */
const TvRow: FC<PropsWithChildren<TvRowProps>> = ({ title, children }) => (
    <Box component='section' data-tv-row sx={{ mb: '1.4vw' }}>
        {title && (
            <Box component='h2' sx={{ m: 0, mb: '0.5vw', color: '#e5e5e5', fontSize: '1.45vw', fontWeight: 600 }}>
                {title}
            </Box>
        )}
        {/* Room around the tiles for the focus ring */}
        <Box sx={{ overflow: 'hidden', mx: '-0.5vw', p: '0.5vw' }}>
            <Box
                data-tv-track
                sx={{
                    position: 'relative',
                    display: 'flex',
                    gap: TILE_GAP,
                    transition: 'transform 0.3s ease-out'
                }}
            >
                {children}
            </Box>
        </Box>
    </Box>
);

export default TvRow;
