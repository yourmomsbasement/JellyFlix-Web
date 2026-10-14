import { describe, expect, it } from 'vitest';

import config from '../../config.json';
import defaultTheme from '../index';
import { DEFAULT_JELLYFLIX_THEME, JELLYFLIX_PALETTES } from './palettes';
import { buildJellyFlixScheme, toChannel } from './scheme';

describe('JellyFlix themes', () => {
    it('turns colors into CSS channels', () => {
        expect(toChannel('#e50914')).toBe('229 9 20');
        expect(toChannel('#fff')).toBe('255 255 255');
    });

    it('builds a scheme from a palette', () => {
        const scheme = buildJellyFlixScheme(JELLYFLIX_PALETTES.midnight);
        expect(scheme.palette?.primary).toMatchObject({ main: '#7aa2ff', mainChannel: '122 162 255' });
        expect(scheme.palette?.background).toMatchObject({ default: '#0d1117', defaultChannel: '13 17 23' });
    });

    it('defaults to Midnight, with Classic Red still offered', () => {
        const defaults = config.themes.filter(theme => 'default' in theme && theme.default);
        expect(defaults.map(theme => theme.id)).toEqual([DEFAULT_JELLYFLIX_THEME]);
        expect(DEFAULT_JELLYFLIX_THEME).not.toBe('jellyflix');
        expect(config.themes.find(theme => theme.id === 'jellyflix')?.name).toBe('Classic Red');
    });

    it('registers every JellyFlix palette as a color scheme', () => {
        for (const id of Object.keys(JELLYFLIX_PALETTES)) {
            expect(defaultTheme.colorSchemes).toHaveProperty(id);
            expect(config.themes.some(theme => theme.id === id)).toBe(true);
        }
    });
});
