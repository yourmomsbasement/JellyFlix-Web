import List from '@mui/material/List';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import React from 'react';

import { useJellyFlixConfiguration } from 'apps/dashboard/features/jellyflix/api/useJellyFlix';
import JellyFlixIcon from 'apps/dashboard/features/jellyflix/components/JellyFlixIcon';
import ListItemLink from 'components/ListItemLink';
import globalize from 'lib/globalize';

/** JellyFlix's settings, next to the server's own; only shown when the JellyFlix plugin is installed. */
const JellyFlixDrawerSection = () => {
    const { data: configuration } = useJellyFlixConfiguration();
    if (!configuration) return null;

    return (
        <List
            aria-labelledby='jellyflix-subheader'
            subheader={
                <ListSubheader component='div' id='jellyflix-subheader'>
                    JellyFlix
                </ListSubheader>
            }
        >
            <ListItemLink to='/dashboard/jellyflix'>
                <ListItemIcon>
                    <JellyFlixIcon />
                </ListItemIcon>
                <ListItemText primary={globalize.translate('Settings')} />
            </ListItemLink>
        </List>
    );
};

export default JellyFlixDrawerSection;
