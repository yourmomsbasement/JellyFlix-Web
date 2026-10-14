import Box from '@mui/material/Box';
import type { SxProps, Theme } from '@mui/material/styles';
import React, { type FC, useId } from 'react';

interface LureProps {
    viewBox: string
    /** Where the stalk starts, on top of the L. */
    base: [ number, number ]
    /** The glowing orb's centre. */
    orb: [ number, number ]
    orbRadius: number
    stroke: number
    /** The soft glow around the orb; none when 0. */
    glowRadius: number
    sx?: SxProps<Theme>
}

/** The lanternfish's lure: a stalk curving up and over to a glowing orb, in the theme's accent color. */
const Lure: FC<LureProps> = ({ viewBox, base: [ bx, by ], orb: [ ox, oy ], orbRadius, stroke, glowRadius, sx }) => {
    const glowId = useId();
    // Up from the L, then over to the orb's left edge
    const end = ox - orbRadius * 0.95;
    const path = `M${bx} ${by} C${bx} ${oy + (by - oy) * 0.35} ${bx + (end - bx) * 0.2} ${oy} ${end} ${oy}`;
    return (
        <Box component='svg' viewBox={viewBox} aria-hidden sx={[ { color: 'primary.main' }, ...(Array.isArray(sx) ? sx : [ sx ]) ]}>
            {glowRadius > 0 && (
                <>
                    <defs>
                        <radialGradient id={glowId}>
                            <stop offset='0' stopColor='currentColor' stopOpacity='0.75' />
                            <stop offset='0.4' stopColor='currentColor' stopOpacity='0.3' />
                            <stop offset='1' stopColor='currentColor' stopOpacity='0' />
                        </radialGradient>
                    </defs>
                    <circle cx={ox} cy={oy} r={glowRadius} fill={`url(#${glowId})`} />
                </>
            )}
            <path d={path} stroke='currentColor' strokeWidth={stroke} fill='none' strokeLinecap='round' />
            <circle cx={ox} cy={oy} r={orbRadius} fill='currentColor' />
            <circle cx={ox - orbRadius * 0.32} cy={oy - orbRadius * 0.32} r={orbRadius * 0.3} fill='#fff' opacity='0.75' />
        </Box>
    );
};

export default Lure;
