import { createTheme } from '@mui/material/styles';
import merge from 'lodash-es/merge';

import { DEFAULT_THEME_OPTIONS } from './_base/theme';
import appletv from './appletv';
import aurora from './aurora';
import blueradiance from './blueradiance';
import dark from './dark';
import ember from './ember';
import jellyflix from './jellyflix';
import { JELLYFLIX_DASHBOARD_COMPONENTS } from './jellyflix/dashboard';
import { DEFAULT_JELLYFLIX_THEME } from './jellyflix/palettes';
import light from './light';
import midnight from './midnight';
import purplehaze from './purplehaze';
import wmc from './wmc';

/** The default theme containing all color scheme variants. */
const DEFAULT_THEME = createTheme({
    cssVariables: {
        cssVarPrefix: 'jf',
        colorSchemeSelector: '[data-theme="%s"]',
        disableCssColorScheme: true
    },
    defaultColorScheme: DEFAULT_JELLYFLIX_THEME,
    ...DEFAULT_THEME_OPTIONS,
    components: merge({}, DEFAULT_THEME_OPTIONS.components, JELLYFLIX_DASHBOARD_COMPONENTS),
    colorSchemes: {
        appletv,
        aurora,
        blueradiance,
        dark,
        ember,
        jellyflix,
        light,
        midnight,
        purplehaze,
        wmc
    }
});

export default DEFAULT_THEME;
