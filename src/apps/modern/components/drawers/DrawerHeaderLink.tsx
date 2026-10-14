import { getDisplayVersion } from '@jellyfin/sdk/lib/utils/versioning';
import Box from '@mui/material/Box';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import React from 'react';

import { useSystemInfo } from 'hooks/useSystemInfo';
import ListItemLink from 'components/ListItemLink';

const DrawerHeaderLink = () => {
    const { data: systemInfo } = useSystemInfo();

    return (
        <ListItemLink to='/'>
            <ListItemIcon sx={{ minWidth: 56 }}>
                <Box
                    component='span'
                    aria-hidden
                    sx={{ width: '2.5rem', color: 'primary.main', fontSize: '2.6rem', fontWeight: 900, lineHeight: 1, textAlign: 'center', transform: 'scaleY(1.15)' }}
                >
                    J
                </Box>
            </ListItemIcon>
            <ListItemText
                primary={systemInfo?.ServerName || 'JellyFlix'}
                secondary={getDisplayVersion(systemInfo?.Version)}
                slotProps={{
                    primary: { variant: 'h6' }
                }}
            />
        </ListItemLink>);
};

export default DrawerHeaderLink;
