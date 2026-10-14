import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import React from 'react';

import { useJellyFlixConfiguration, useWebUpdateStatus } from 'apps/dashboard/features/jellyflix/api/useJellyFlix';
import { getWebClientSummary } from 'apps/dashboard/routes/jellyflix';
import globalize from 'lib/globalize';

import Widget from './Widget';

/** The JellyFlix plugin at a glance; hidden without the plugin. */
const JellyFlixWidget = () => {
    const { data: configuration } = useJellyFlixConfiguration();
    const { data: status } = useWebUpdateStatus();
    if (!configuration) return null;

    return (
        <Widget title='JellyFlix' href='/dashboard/jellyflix'>
            <Paper sx={{ p: 2 }}>
                <Stack spacing={1}>
                    <Stack direction='row' spacing={2}>
                        <Typography sx={{ fontWeight: 'bold', minWidth: 160 }}>{globalize.translate('HeaderWebClient')}</Typography>
                        <Typography>{status?.Installed?.Version ?? globalize.translate('NotYet')}</Typography>
                    </Stack>
                    <Stack direction='row' spacing={2}>
                        <Typography sx={{ fontWeight: 'bold', minWidth: 160 }}>{globalize.translate('HeaderProfiles')}</Typography>
                        <Typography>{globalize.translate('JellyFlixSummaryProfiles', String(configuration.MaxProfilesPerHousehold))}</Typography>
                    </Stack>
                    {status && <Typography sx={{ color: 'text.secondary', pt: 1 }}>{getWebClientSummary(status)}</Typography>}
                </Stack>
            </Paper>
        </Widget>
    );
};

export default JellyFlixWidget;
