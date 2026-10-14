import { getDisplayVersion } from '@jellyfin/sdk/lib/utils/versioning';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import React from 'react';

import LanternfishMark from 'components/branding/LanternfishMark';
import { useSystemInfo } from 'hooks/useSystemInfo';
import ListItemLink from 'components/ListItemLink';

const DrawerHeaderLink = () => {
    const { data: systemInfo } = useSystemInfo();

    return (
        <ListItemLink to='/'>
            <ListItemIcon sx={{ minWidth: 56 }}>
                <LanternfishMark size='2.4rem' glow />
            </ListItemIcon>
            <ListItemText
                primary={systemInfo?.ServerName || 'Lanternfish'}
                secondary={getDisplayVersion(systemInfo?.Version)}
                slotProps={{
                    primary: { variant: 'h6' }
                }}
            />
        </ListItemLink>);
};

export default DrawerHeaderLink;
