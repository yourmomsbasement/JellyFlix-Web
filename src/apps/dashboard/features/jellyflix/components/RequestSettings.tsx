import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import React, { type FC } from 'react';

import {
    type JellyFlixConfiguration,
    useSaveJellyFlixConfiguration,
    useTestRequests
} from 'apps/dashboard/features/jellyflix/api/useJellyFlix';
import { getRequestError } from 'apps/legacy/features/search/api/useRequests';
import globalize from 'lib/globalize';

import { Check, ResultPanel, Section } from './SettingsParts';

type Provider = 'Seerr' | 'Ombi';

/** Each service's fields; plugins before 1.4.0 only know Seerr's. */
const FIELDS = {
    Seerr: { url: 'SeerrUrl', key: 'SeerrApiKey', where: 'SeerrFailedWhere' },
    Ombi: { url: 'OmbiUrl', key: 'OmbiApiKey', where: 'OmbiFailedHelp' }
} as const;

const TestResult: FC<{ test: ReturnType<typeof useTestRequests>, provider: Provider, isRequestsEnabled: boolean }> = ({ test, provider, isRequestsEnabled }) => {
    const name = test.data?.provider ?? provider;
    return (
        <ResultPanel
            isPending={test.isPending}
            pendingText={globalize.translate('SeerrTesting', provider)}
            severity={(test.isSuccess && 'success') || (test.isError && 'error') || undefined}
            title={globalize.translate(test.isSuccess ? 'SeerrConnectedTitle' : 'SeerrFailedTitle', name)}
        >
            {test.isSuccess && (
                <>
                    {globalize.translate('SeerrVersion', name, test.data.version)}{' '}
                    {globalize.translate(isRequestsEnabled ? 'SeerrConnectedReady' : 'SeerrConnectedTurnOn')}
                </>
            )}
            {test.isError && (
                <>
                    <Box sx={{ fontWeight: 600 }}>{getRequestError(test.error)}</Box>
                    {globalize.translate('SeerrFailedHelp')} {globalize.translate(FIELDS[provider].where)}
                </>
            )}
        </ResultPanel>
    );
};

interface RequestSettingsProps {
    configuration: JellyFlixConfiguration
    update: (changes: Partial<JellyFlixConfiguration>) => void
    save: ReturnType<typeof useSaveJellyFlixConfiguration>
}

/** Requests through Seerr or Ombi. */
const RequestSettings: FC<RequestSettingsProps> = ({ configuration, update, save }) => {
    const test = useTestRequests();
    const hasChoice = configuration.RequestsProvider !== undefined;
    const provider: Provider = configuration.RequestsProvider ?? 'Seerr';
    const fields = FIELDS[provider];
    const url = configuration[fields.url] ?? '';
    const apiKey = configuration[fields.key] ?? '';

    if (configuration.RequestsEnabled === undefined) {
        return (
            <Section title={globalize.translate('HeaderRequests')} description={globalize.translate('JellyFlixRequestsHelp')}>
                <Alert severity='warning'>{globalize.translate('JellyFlixRequestsOutdated')}</Alert>
            </Section>
        );
    }

    return (
        <Section title={globalize.translate('HeaderRequests')} description={globalize.translate('JellyFlixRequestsHelp')}>
            <Check
                label={globalize.translate('LabelRequestsEnabled')}
                checked={configuration.RequestsEnabled}
                onChange={checked => update({ RequestsEnabled: checked })}
            />
            {hasChoice ? (
                <Box>
                    <Typography variant='body2' sx={{ mb: 1, color: 'text.secondary' }}>{globalize.translate('LabelRequestsProvider')}</Typography>
                    <ToggleButtonGroup
                        exclusive
                        value={provider}
                        onChange={(_e, value: Provider | null) => {
                            if (!value) return;
                            test.reset();
                            update({ RequestsProvider: value });
                        }}
                        aria-label={globalize.translate('LabelRequestsProvider')}
                    >
                        <ToggleButton value='Seerr' sx={{ px: 3 }}>{globalize.translate('RequestsProviderSeerr')}</ToggleButton>
                        <ToggleButton value='Ombi' sx={{ px: 3 }}>{globalize.translate('RequestsProviderOmbi')}</ToggleButton>
                    </ToggleButtonGroup>
                </Box>
            ) : (
                <Alert severity='info'>{globalize.translate('JellyFlixOmbiOutdated')}</Alert>
            )}
            <TextField
                key={`${provider}-url`}
                type='url'
                label={globalize.translate(provider === 'Ombi' ? 'LabelOmbiUrl' : 'LabelSeerrUrl')}
                helperText={globalize.translate(provider === 'Ombi' ? 'OmbiUrlHelp' : 'SeerrUrlHelp')}
                value={url}
                onChange={e => update({ [fields.url]: e.target.value.trim() })}
            />
            <TextField
                key={`${provider}-key`}
                type='password'
                autoComplete='off'
                label={globalize.translate(provider === 'Ombi' ? 'LabelOmbiApiKey' : 'LabelSeerrApiKey')}
                helperText={globalize.translate(provider === 'Ombi' ? 'OmbiApiKeyHelp' : 'SeerrApiKeyHelp')}
                value={apiKey}
                onChange={e => update({ [fields.key]: e.target.value.trim() })}
            />
            <Check
                label={globalize.translate('LabelAllowKidsRequests')}
                checked={!!configuration.AllowKidsRequests}
                onChange={checked => update({ AllowKidsRequests: checked })}
            />
            <Box>
                <Button
                    variant='outlined'
                    disabled={save.isPending || test.isPending || !url || !apiKey}
                    // The test uses the saved settings, so save first
                    onClick={() => {
                        test.reset();
                        save.mutate(configuration, { onSuccess: () => test.mutate() });
                    }}
                >
                    {globalize.translate('ButtonTestSeerr')}
                </Button>
            </Box>
            <TestResult test={test} provider={provider} isRequestsEnabled={!!configuration.RequestsEnabled} />
        </Section>
    );
};

export default RequestSettings;
