import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import React, { type FC } from 'react';

import {
    type JellyFlixConfiguration,
    type SearchStatus,
    useBuildSearchIndex,
    useSaveJellyFlixConfiguration,
    useSearchStatus,
    useTestEmbeddings
} from 'apps/dashboard/features/jellyflix/api/useJellyFlix';
import { getRequestError } from 'apps/legacy/features/search/api/useRequests';
import globalize from 'lib/globalize';

import { Check, ResultPanel, Section } from './SettingsParts';

interface SearchSettingsProps {
    configuration: JellyFlixConfiguration
    update: (changes: Partial<JellyFlixConfiguration>) => void
    save: ReturnType<typeof useSaveJellyFlixConfiguration>
}

const EmbeddingsTestResult: FC<{ test: ReturnType<typeof useTestEmbeddings> }> = ({ test }) => (
    <ResultPanel
        isPending={test.isPending}
        pendingText={globalize.translate('EmbeddingsTesting')}
        severity={(test.isSuccess && 'success') || (test.isError && 'error') || undefined}
        title={globalize.translate(test.isSuccess ? 'EmbeddingsConnectedTitle' : 'EmbeddingsFailedTitle')}
    >
        {test.isSuccess && globalize.translate('EmbeddingsConnected', test.data.Model, test.data.Dimensions)}
        {test.isError && (
            <>
                <Box sx={{ fontWeight: 600 }}>{getRequestError(test.error)}</Box>
                {globalize.translate('EmbeddingsFailedHelp')}
            </>
        )}
    </ResultPanel>
);

const BuildResult: FC<{ status: SearchStatus | null | undefined, build: ReturnType<typeof useBuildSearchIndex> }> = ({ status, build }) => {
    const isBuilding = status?.BuildProgress != null;
    const failed = !!status?.LastBuildResult?.startsWith('Failed') || build.isError;
    const isDone = build.isSuccess && !isBuilding && !!status?.LastBuildResult;

    return (
        <ResultPanel
            isPending={build.isPending || isBuilding}
            pendingText={globalize.translate('SearchIndexBuilding', Math.round(status?.BuildProgress ?? 0))}
            progress={status?.BuildProgress}
            severity={((isDone || build.isError) && (failed ? 'error' : 'success')) || undefined}
            title={globalize.translate(failed ? 'SearchIndexFailed' : 'SearchIndexBuilt')}
        >
            {build.isError ? getRequestError(build.error) : status?.LastBuildResult}
        </ResultPanel>
    );
};

/** Description search: always on with words; by meaning too with an embeddings API. */
const SearchSettings: FC<SearchSettingsProps> = ({ configuration, update, save }) => {
    const isSupported = configuration.SemanticSearchEnabled !== undefined;
    const { data: status } = useSearchStatus(isSupported);
    const test = useTestEmbeddings();
    const build = useBuildSearchIndex();
    const isSetUp = !!configuration.EmbeddingsUrl && !!configuration.EmbeddingsModel;

    // Both use the saved settings, so save first
    const saveThen = (action: () => void) => () => {
        test.reset();
        build.reset();
        save.mutate(configuration, { onSuccess: action });
    };

    return (
        <Section title={globalize.translate('Search')} description={globalize.translate('JellyFlixSearchHelp')}>
            {isSupported ? (
                <>
                    {status && (
                        <Typography sx={{ color: 'text.secondary' }}>
                            {globalize.translate('SearchIndexStatus', status.Titles, status.EmbeddedTitles)}
                        </Typography>
                    )}
                    <Check
                        label={globalize.translate('LabelSemanticSearchEnabled')}
                        help={globalize.translate('SemanticSearchEnabledHelp')}
                        checked={!!configuration.SemanticSearchEnabled}
                        onChange={checked => update({ SemanticSearchEnabled: checked })}
                    />
                    <TextField
                        type='url'
                        label={globalize.translate('LabelEmbeddingsUrl')}
                        helperText={globalize.translate('EmbeddingsUrlHelp')}
                        value={configuration.EmbeddingsUrl ?? ''}
                        onChange={e => update({ EmbeddingsUrl: e.target.value.trim() })}
                    />
                    <TextField
                        label={globalize.translate('LabelEmbeddingsModel')}
                        helperText={globalize.translate('EmbeddingsModelHelp')}
                        value={configuration.EmbeddingsModel ?? ''}
                        onChange={e => update({ EmbeddingsModel: e.target.value.trim() })}
                    />
                    <TextField
                        type='password'
                        autoComplete='off'
                        label={globalize.translate('LabelEmbeddingsApiKey')}
                        helperText={globalize.translate('EmbeddingsApiKeyHelp')}
                        value={configuration.EmbeddingsApiKey ?? ''}
                        onChange={e => update({ EmbeddingsApiKey: e.target.value.trim() })}
                    />
                    <Stack direction='row' spacing={1.5} useFlexGap sx={{ flexWrap: 'wrap' }}>
                        <Button variant='outlined' disabled={save.isPending || test.isPending || !isSetUp} onClick={saveThen(() => test.mutate())}>
                            {globalize.translate('ButtonTestEmbeddings')}
                        </Button>
                        <Button
                            variant='outlined'
                            disabled={save.isPending || build.isPending || status?.BuildProgress != null || !isSetUp || !configuration.SemanticSearchEnabled}
                            onClick={saveThen(() => build.mutate())}
                        >
                            {globalize.translate('ButtonBuildSearchIndex')}
                        </Button>
                    </Stack>
                    <EmbeddingsTestResult test={test} />
                    <BuildResult status={status} build={build} />
                </>
            ) : (
                <Alert severity='warning'>{globalize.translate('JellyFlixSearchOutdated')}</Alert>
            )}
        </Section>
    );
};

export default SearchSettings;
