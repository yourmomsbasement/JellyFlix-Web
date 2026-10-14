import type { Season } from './api/useAppearance';

interface SeasonStyle {
    /** The home page's accent: buttons, progress bars, highlights. Dark enough for white text. */
    accent: string
}

export const SEASON_STYLES: Record<Exclude<Season, 'None'>, SeasonStyle> = {
    // Pumpkin orange
    Halloween: { accent: '#D9480F' },
    // Holly red
    Christmas: { accent: '#C8102E' },
    // Ocean teal
    Summer: { accent: '#0E7C86' }
};

export const getSeasonAccent = (season: Season | undefined) => (season && season !== 'None' ? SEASON_STYLES[season].accent : undefined);
