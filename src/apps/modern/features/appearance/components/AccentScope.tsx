import Box from '@mui/material/Box';
import { keyframes, type SxProps, type Theme } from '@mui/material/styles';
import React, { type FC, type PropsWithChildren } from 'react';

import { fromHex, shade } from '../utils/accentColor';

const fadeIn = keyframes`from { opacity: 0; } to { opacity: 1; }`;

const channel = (hex: string) => fromHex(hex).join(' ');

/**
 * The theme's primary color, swapped for an accent inside this section: the theme's CSS variables are overridden, so
 * buttons, progress bars and highlights that use the primary color all follow, and nothing else changes.
 */
export const accentVars = (accent: string) => {
    const dark = shade(accent, -0.08);
    const light = shade(accent, 0.12);
    return {
        '--jf-palette-primary-main': accent,
        '--jf-palette-primary-mainChannel': channel(accent),
        '--jf-palette-primary-dark': dark,
        '--jf-palette-primary-darkChannel': channel(dark),
        '--jf-palette-primary-light': light,
        '--jf-palette-primary-lightChannel': channel(light),
        '--jf-palette-primary-contrastText': '#fff',
        '--jf-accent-channel': channel(accent)
    };
};

interface AccentScopeProps {
    /** The accent; nothing changes without one. */
    accent?: string | null
    /** A soft glow of the accent behind the section, from the top down to this depth (e.g. '120vh'). */
    glow?: string
    sx?: SxProps<Theme>
}

const AccentScope: FC<PropsWithChildren<AccentScopeProps>> = ({ accent, glow, sx, children }) => (
    <Box sx={[ { position: 'relative', ...(accent && accentVars(accent)) }, ...(Array.isArray(sx) ? sx : [ sx ]) ]}>
        {accent && glow && (
            <Box
                aria-hidden
                sx={{
                    position: 'absolute',
                    inset: 0,
                    bottom: 'auto',
                    height: glow,
                    pointerEvents: 'none',
                    zIndex: 0,
                    background: 'radial-gradient(80% 45% at 35% 62%, rgb(var(--jf-accent-channel) / 0.2), transparent 70%), '
                        + 'linear-gradient(to bottom, transparent 40%, rgb(var(--jf-accent-channel) / 0.1) 70%, transparent)',
                    animation: `${fadeIn} 0.8s ease-out`
                }}
            />
        )}
        {children}
    </Box>
);

export default AccentScope;
