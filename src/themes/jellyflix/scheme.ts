import { buildCustomColorScheme } from 'themes/utils';

import type { JellyFlixPalette } from './palettes';

/** "#e50914" or "#fff" -> "229 9 20" */
export function toChannel(hex: string): string {
    let value = hex.replace('#', '');
    if (value.length === 3) value = value.split('').map(c => c + c).join('');
    const number = parseInt(value, 16);
    return `${(number >> 16) & 255} ${(number >> 8) & 255} ${number & 255}`;
}

/** A JellyFlix color scheme (near-black with one accent color) from a palette. */
export function buildJellyFlixScheme(p: JellyFlixPalette) {
    return buildCustomColorScheme({
        palette: {
            // The channels are spelled out: the scheme is merged over MUI's dark one, whose precomputed (blue) channels
            // would otherwise tint selected and hovered items
            primary: {
                main: p.accent,
                mainChannel: toChannel(p.accent),
                dark: p.accentDark,
                darkChannel: toChannel(p.accentDark),
                light: p.accentLight,
                lightChannel: toChannel(p.accentLight),
                contrastText: p.onAccent,
                contrastTextChannel: toChannel(p.onAccent)
            },
            secondary: {
                main: p.accent,
                mainChannel: toChannel(p.accent),
                contrastText: p.onAccent,
                contrastTextChannel: toChannel(p.onAccent)
            },
            // Everything that isn't the accent stays neutral
            info: {
                main: '#6d6d6e',
                mainChannel: '109 109 110',
                contrastText: '#fff',
                contrastTextChannel: '255 255 255'
            },
            success: {
                main: p.match,
                mainChannel: toChannel(p.match)
            },
            background: {
                default: p.background,
                defaultChannel: toChannel(p.background),
                paper: p.paper,
                paperChannel: toChannel(p.paper)
            },
            text: {
                primary: '#fff',
                secondary: p.muted
            },
            action: {
                hover: 'rgba(255, 255, 255, 0.1)',
                focus: 'rgba(255, 255, 255, 0.16)'
            },
            divider: 'rgba(255, 255, 255, 0.1)',
            AppBar: {
                defaultBg: p.background
            },
            Button: {
                inheritContainedBg: 'rgba(109, 109, 110, 0.7)',
                inheritContainedHoverBg: 'rgba(109, 109, 110, 0.4)'
            },
            FilledInput: {
                bg: p.input
            },
            SnackbarContent: {
                bg: '#e5e5e5',
                color: p.background
            }
        }
    });
}
