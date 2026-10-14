import Alert, { type AlertColor } from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import React, { type FC, type FormEvent, useEffect, useState } from 'react';

import {
    type JellyFlixConfiguration,
    SettingsNotKeptError,
    useCheckForWebUpdates,
    useJellyFlixConfiguration,
    useSaveJellyFlixConfiguration,
    useTestSeerr,
    useWebUpdateStatus,
    type WebUpdateStatus
} from 'apps/dashboard/features/jellyflix/api/useJellyFlix';
import SearchSettings from 'apps/dashboard/features/jellyflix/components/SearchSettings';
import { Check, ResultPanel, Section } from 'apps/dashboard/features/jellyflix/components/SettingsParts';
import { getRequestError } from 'apps/legacy/features/search/api/useRequests';
import Loading from 'components/loading/LoadingComponent';
import toast from 'components/toast/toast';
import Page from 'components/Page';
import globalize from 'lib/globalize';

/** How a web client check went, from the updater's own words. */
const getUpdateOutcome = (result: string | null | undefined): { severity: AlertColor, title: string } => {
    if (result?.startsWith('Installed')) return { severity: 'success', title: globalize.translate('WebUpdateInstalled') };
    if (result?.startsWith('Up to date')) return { severity: 'success', title: globalize.translate('WebUpdateUpToDate') };
    if (result?.startsWith('Update failed')) return { severity: 'error', title: globalize.translate('WebUpdateFailed') };
    return { severity: 'warning', title: globalize.translate('WebUpdateNothingToInstall') };
};

const SeerrTestResult: FC<{ test: ReturnType<typeof useTestSeerr>, isRequestsEnabled: boolean }> = ({ test, isRequestsEnabled }) => (
    <ResultPanel
        isPending={test.isPending}
        pendingText={globalize.translate('SeerrTesting')}
        severity={(test.isSuccess && 'success') || (test.isError && 'error') || undefined}
        title={globalize.translate(test.isSuccess ? 'SeerrConnectedTitle' : 'SeerrFailedTitle')}
    >
        {test.isSuccess && (
            <>
                {globalize.translate('SeerrVersion', test.data)}{' '}
                {globalize.translate(isRequestsEnabled ? 'SeerrConnectedReady' : 'SeerrConnectedTurnOn')}
            </>
        )}
        {test.isError && (
            <>
                <Box sx={{ fontWeight: 600 }}>{getRequestError(test.error)}</Box>
                {globalize.translate('SeerrFailedHelp')}
            </>
        )}
    </ResultPanel>
);

const UpdateCheckResult: FC<{ check: ReturnType<typeof useCheckForWebUpdates> }> = ({ check }) => {
    const result = check.data?.LastResult;
    const outcome = getUpdateOutcome(result);
    const canReload = !!result?.startsWith('Installed') && !!check.data?.IsServerUsingInstall;

    return (
        <ResultPanel
            isPending={check.isPending}
            pendingText={globalize.translate('WebUpdateChecking')}
            severity={(check.isSuccess && outcome.severity) || (check.isError && 'error') || undefined}
            title={check.isSuccess ? outcome.title : globalize.translate('WebUpdateFailed')}
            action={canReload ? <Button color='inherit' onClick={() => window.location.reload()}>{globalize.translate('ButtonReloadNow')}</Button> : undefined}
        >
            {check.isSuccess && <>{result}{canReload && <> {globalize.translate('WebUpdateReloadHelp')}</>}</>}
            {check.isError && getRequestError(check.error)}
        </ResultPanel>
    );
};

/** Who sees which web client, in a sentence. */
export const getWebClientSummary = (status: WebUpdateStatus) => {
    if (status.IsServerUsingInstall) {
        return globalize.translate(status.IsServedByPlugin ? 'WebClientServedByPlugin' : 'WebClientServedByWebDir');
    }
    return globalize.translate(status.Installed ? 'WebClientServingOff' : 'WebClientNotInstalled');
};

const formatDate = (value: string | null | undefined) => (value ? new Date(value).toLocaleString() : globalize.translate('NotYet'));

const StatusTable: FC<{ status: WebUpdateStatus }> = ({ status }) => (
    <Box component='table' sx={{ borderCollapse: 'collapse', '& th': { pr: 3, pb: 1, textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap', verticalAlign: 'top' }, '& td': { pb: 1, wordBreak: 'break-word' } }}>
        <tbody>
            <tr>
                <th>{globalize.translate('LabelInstalledVersion')}</th>
                <td>{status.Installed ? `${status.Installed.Version} (${formatDate(status.Installed.InstalledAt)})` : globalize.translate('NotYet')}</td>
            </tr>
            <tr>
                <th>{globalize.translate('LabelLatestVersion')}</th>
                <td>{status.LatestVersion ?? '—'}</td>
            </tr>
            <tr>
                <th>{globalize.translate('LabelLastCheck')}</th>
                <td>{formatDate(status.LastCheck)}{status.LastResult ? ` — ${status.LastResult}` : ''}</td>
            </tr>
            <tr>
                <th>{globalize.translate('LabelInstallFolder')}</th>
                <td><code>{status.InstallPath}</code></td>
            </tr>
        </tbody>
    </Box>
);

/** The JellyFlix plugin's settings, as a native dashboard page. */
export const Component: FC = () => {
    const { data: savedConfiguration, isPending, isError } = useJellyFlixConfiguration();
    const { data: status } = useWebUpdateStatus();
    const save = useSaveJellyFlixConfiguration();
    const checkForUpdates = useCheckForWebUpdates();
    const testSeerr = useTestSeerr();
    const [ configuration, setConfiguration ] = useState<JellyFlixConfiguration>();

    useEffect(() => {
        if (savedConfiguration) setConfiguration(savedConfiguration);
    }, [ savedConfiguration ]);

    const update = (changes: Partial<JellyFlixConfiguration>) => {
        setConfiguration(current => current && { ...current, ...changes });
        save.reset();
    };

    const onSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!configuration) return;
        save.mutate(configuration, {
            onSuccess: () => toast(globalize.translate('SettingsSaved')),
            onError: err => console.error('[JellyFlix] failed to save settings', err)
        });
    };

    if (isPending) return <Loading />;

    return (
        <Page id='jellyflixSettingsPage' title='JellyFlix' className='type-interior mainAnimatedPage'>
            <Box className='content-primary'>
                <Stack spacing={3} component='form' onSubmit={onSubmit}>
                    <Box>
                        <Typography variant='h1'>JellyFlix</Typography>
                        <Typography sx={{ color: 'text.secondary', mt: 1 }}>{globalize.translate('JellyFlixSettingsHelp')}</Typography>
                    </Box>

                    {isError && <Alert severity='error'>{globalize.translate('SettingsPageLoadError')}</Alert>}
                    {!isError && savedConfiguration === null && <Alert severity='info'>{globalize.translate('JellyFlixPluginMissing')}</Alert>}

                    {configuration && (
                        <>
                            <Section title={globalize.translate('HeaderProfiles')} description={globalize.translate('JellyFlixProfilesHelp')}>
                                <TextField
                                    type='number'
                                    label={globalize.translate('LabelMaxProfilesPerHousehold')}
                                    helperText={globalize.translate('MaxProfilesPerHouseholdHelp')}
                                    value={configuration.MaxProfilesPerHousehold}
                                    onChange={e => update({ MaxProfilesPerHousehold: parseInt(e.target.value, 10) || 1 })}
                                    slotProps={{ htmlInput: { min: 1, max: 20 } }}
                                />
                                <TextField
                                    type='number'
                                    label={globalize.translate('LabelKidsMaxParentalRating')}
                                    helperText={globalize.translate('KidsMaxParentalRatingHelp')}
                                    value={configuration.KidsMaxParentalRating}
                                    onChange={e => update({ KidsMaxParentalRating: parseInt(e.target.value, 10) || 0 })}
                                    slotProps={{ htmlInput: { min: 0, max: 1000 } }}
                                />
                                <Check
                                    label={globalize.translate('LabelAllowNonAdminOwners')}
                                    checked={configuration.AllowNonAdminOwners}
                                    onChange={checked => update({ AllowNonAdminOwners: checked })}
                                />
                            </Section>

                            <Section title={globalize.translate('HeaderRecommendations')} description={globalize.translate('JellyFlixRecommendationsHelp')} />

                            <Section title={globalize.translate('HeaderRequests')} description={globalize.translate('JellyFlixRequestsHelp')}>
                                {configuration.RequestsEnabled === undefined ? (
                                    <Alert severity='warning'>{globalize.translate('JellyFlixRequestsOutdated')}</Alert>
                                ) : (
                                    <>
                                        <Check
                                            label={globalize.translate('LabelRequestsEnabled')}
                                            checked={configuration.RequestsEnabled}
                                            onChange={checked => update({ RequestsEnabled: checked })}
                                        />
                                        <TextField
                                            type='url'
                                            label={globalize.translate('LabelSeerrUrl')}
                                            helperText={globalize.translate('SeerrUrlHelp')}
                                            value={configuration.SeerrUrl ?? ''}
                                            onChange={e => update({ SeerrUrl: e.target.value.trim() })}
                                        />
                                        <TextField
                                            type='password'
                                            autoComplete='off'
                                            label={globalize.translate('LabelSeerrApiKey')}
                                            helperText={globalize.translate('SeerrApiKeyHelp')}
                                            value={configuration.SeerrApiKey ?? ''}
                                            onChange={e => update({ SeerrApiKey: e.target.value.trim() })}
                                        />
                                        <Check
                                            label={globalize.translate('LabelAllowKidsRequests')}
                                            checked={!!configuration.AllowKidsRequests}
                                            onChange={checked => update({ AllowKidsRequests: checked })}
                                        />
                                        <Box>
                                            <Button
                                                variant='outlined'
                                                disabled={save.isPending || testSeerr.isPending || !configuration.SeerrUrl || !configuration.SeerrApiKey}
                                                // The test uses the saved settings, so save first
                                                onClick={() => {
                                                    testSeerr.reset();
                                                    save.mutate(configuration, { onSuccess: () => testSeerr.mutate() });
                                                }}
                                            >
                                                {globalize.translate('ButtonTestSeerr')}
                                            </Button>
                                        </Box>
                                        <SeerrTestResult test={testSeerr} isRequestsEnabled={!!configuration.RequestsEnabled} />
                                    </>
                                )}
                            </Section>

                            <SearchSettings configuration={configuration} update={update} save={save} />

                            <Section title={globalize.translate('HeaderWebClient')} description={status ? getWebClientSummary(status) : ''}>
                                {status && <StatusTable status={status} />}
                                {configuration.ServeWebClient === undefined ? (
                                    // Older plugins can't serve the web client, and drop the setting when saved
                                    <Alert severity='warning'>{globalize.translate('JellyFlixPluginOutdated')}</Alert>
                                ) : (
                                    <Check
                                        label={globalize.translate('LabelServeWebClient')}
                                        help={globalize.translate(status && status.IsServerUsingInstall && !status.IsServedByPlugin ? 'ServeWebClientWebDirHelp' : 'ServeWebClientHelp')}
                                        checked={configuration.ServeWebClient}
                                        onChange={checked => update({ ServeWebClient: checked })}
                                    />
                                )}
                                <Check
                                    label={globalize.translate('LabelWebUpdatesEnabled')}
                                    help={globalize.translate('WebUpdatesEnabledHelp')}
                                    checked={configuration.WebUpdatesEnabled}
                                    onChange={checked => update({ WebUpdatesEnabled: checked })}
                                />
                                <TextField
                                    label={globalize.translate('LabelWebReleasesRepository')}
                                    value={configuration.WebReleasesRepository}
                                    onChange={e => update({ WebReleasesRepository: e.target.value.trim() })}
                                />
                                <Box>
                                    <Button variant='outlined' onClick={() => checkForUpdates.mutate()} disabled={checkForUpdates.isPending}>
                                        {globalize.translate('ButtonCheckForUpdates')}
                                    </Button>
                                </Box>
                                <UpdateCheckResult check={checkForUpdates} />
                            </Section>

                            {/* Stays on screen while scrolling, so the result of saving is always visible */}
                            <Paper
                                sx={{
                                    position: 'sticky',
                                    bottom: 16,
                                    zIndex: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 2,
                                    p: 1.5,
                                    backgroundColor: 'rgba(28, 28, 28, 0.92)',
                                    backdropFilter: 'blur(8px)'
                                }}
                            >
                                <Button type='submit' variant='contained' size='large' disabled={save.isPending}>
                                    {globalize.translate('Save')}
                                </Button>
                                {save.isSuccess && <Typography sx={{ color: 'success.main' }}>{globalize.translate('SettingsSaved')}</Typography>}
                                {save.isError && (
                                    <Typography sx={{ color: 'error.main' }}>
                                        {save.error instanceof SettingsNotKeptError ?
                                            globalize.translate('JellyFlixSettingsNotKept', save.error.settings.join(', ')) :
                                            globalize.translate('ErrorDefault')}
                                    </Typography>
                                )}
                            </Paper>
                        </>
                    )}
                </Stack>
            </Box>
        </Page>
    );
};

Component.displayName = 'JellyFlixSettingsPage';
