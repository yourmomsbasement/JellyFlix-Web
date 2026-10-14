/**
 * The JellyFlix color themes. The TV apps (yourmomsbasement/JellyFlix-Client, shared/themes.json) use the same colors.
 * "Midnight" is the default; "Classic Red" keeps the original id `jellyflix` so profiles that chose it keep it.
 */
export interface JellyFlixPalette {
    /** Page background */
    background: string;
    /** Cards, dialogs and menus */
    paper: string;
    /** Buttons, progress, focus rings */
    accent: string;
    accentDark: string;
    accentLight: string;
    /** Text on the accent */
    onAccent: string;
    /** Input fields, the focused episode */
    input: string;
    /** Secondary text */
    muted: string;
    /** The match percentage */
    match: string;
}

export const JELLYFLIX_PALETTES = {
    midnight: {
        background: '#0d1117',
        paper: '#141a24',
        accent: '#7aa2ff',
        accentDark: '#5a80e0',
        accentLight: '#9bb9ff',
        onAccent: '#0d1117',
        input: '#2a3242',
        muted: '#a9b1c2',
        match: '#4cd9a0'
    },
    ember: {
        background: '#14100e',
        paper: '#1c1714',
        accent: '#ff8a3d',
        accentDark: '#e06a1f',
        accentLight: '#ffa566',
        onAccent: '#14100e',
        input: '#3a2e27',
        muted: '#bbada4',
        match: '#9bd96b'
    },
    aurora: {
        background: '#0a1413',
        paper: '#101d1c',
        accent: '#2ed3b7',
        accentDark: '#1faf97',
        accentLight: '#5fe3cc',
        onAccent: '#0a1413',
        input: '#21383a',
        muted: '#a1bab7',
        match: '#b7e36b'
    },
    jellyflix: {
        background: '#141414',
        paper: '#181818',
        accent: '#e50914',
        accentDark: '#b20710',
        accentLight: '#f6121d',
        onAccent: '#fff',
        input: '#333',
        muted: '#b3b3b3',
        match: '#46d369'
    }
} satisfies Record<string, JellyFlixPalette>;

/** The theme new profiles start with. */
export const DEFAULT_JELLYFLIX_THEME = 'midnight';
