import Alert from '@mui/material/Alert';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import React, { type FC } from 'react';

import type { JellyFlixConfiguration } from 'apps/dashboard/features/jellyflix/api/useJellyFlix';
import globalize from 'lib/globalize';

import { Check, Section } from './SettingsParts';

const SEASONS = [
    { value: 'Auto', label: 'SeasonalThemeAuto' },
    { value: 'Off', label: 'Off' },
    { value: 'Halloween', label: 'SeasonHalloween' },
    { value: 'Christmas', label: 'SeasonChristmas' },
    { value: 'Summer', label: 'SeasonSummer' }
] as const;

interface AppearanceSettingsProps {
    configuration: JellyFlixConfiguration
    update: (changes: Partial<JellyFlixConfiguration>) => void
}

/** Seasonal home pages and dynamic interface colors. */
const AppearanceSettings: FC<AppearanceSettingsProps> = ({ configuration, update }) => (
    <Section title={globalize.translate('HeaderAppearance')} description={globalize.translate('JellyFlixAppearanceHelp')}>
        {configuration.SeasonalTheme === undefined ? (
            <Alert severity='warning'>{globalize.translate('JellyFlixAppearanceOutdated')}</Alert>
        ) : (
            <>
                <TextField
                    select
                    label={globalize.translate('LabelSeasonalTheme')}
                    helperText={globalize.translate('SeasonalThemeHelp')}
                    value={configuration.SeasonalTheme}
                    onChange={e => update({ SeasonalTheme: e.target.value as JellyFlixConfiguration['SeasonalTheme'] })}
                >
                    {SEASONS.map(season => <MenuItem key={season.value} value={season.value}>{globalize.translate(season.label)}</MenuItem>)}
                </TextField>
                <Check
                    label={globalize.translate('LabelDynamicColors')}
                    help={globalize.translate('DynamicColorsHelp')}
                    checked={configuration.DynamicColors !== false}
                    onChange={checked => update({ DynamicColors: checked })}
                />
            </>
        )}
    </Section>
);

export default AppearanceSettings;
