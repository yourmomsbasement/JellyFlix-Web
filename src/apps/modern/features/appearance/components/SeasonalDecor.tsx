import Box from '@mui/material/Box';
import { keyframes } from '@mui/material/styles';
import React, { type FC } from 'react';

import type { Season } from '../api/useAppearance';

const flicker = keyframes`0%, 100% { opacity: 1; } 40% { opacity: 0.75; } 55% { opacity: 0.95; } 70% { opacity: 0.7; }`;
const batDrift = keyframes`from { transform: translate(0, 0); } to { transform: translate(-2.5vw, 1.5vw); }`;
const flap = keyframes`from { transform: scaleY(1); } to { transform: scaleY(0.45); }`;
const snowfall = keyframes`0% { transform: translate(0, 0); } 50% { transform: translate(2vw, 45vh); } 100% { transform: translate(-1vw, 90vh); }`;
// Opacity only: animating the glow (box-shadow) would repaint every bulb on every frame, which TVs feel
const twinkle = keyframes`from { opacity: 1; } to { opacity: 0.45; }`;
const spin = keyframes`to { transform: rotate(360deg); }`;
const drift = keyframes`from { transform: translateY(0); } to { transform: translateY(-3vw); }`;

/** A stable "random" number in [0, 1) for decoration layouts, so they don't jump between renders. */
const scatter = (i: number, salt: number) => {
    const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
    return x - Math.floor(x);
};

const BAT_PATH = 'M50 18 C47 12 44 12 43 16 C38 8 26 4 12 10 C20 13 22 19 20 26 C27 22 33 24 36 30 C40 26 45 28 48 34 L50 38 '
    + 'L52 34 C55 28 60 26 64 30 C67 24 73 22 80 26 C78 19 80 13 88 10 C74 4 62 8 57 16 C56 12 53 12 50 18 Z M46 15 L47 9 L49 14 Z M54 15 L53 9 L51 14 Z';

const BATS = [
    { left: 58, top: 16, size: 4.2, delay: 0 },
    { left: 70, top: 9, size: 3, delay: -2.4 },
    { left: 82, top: 22, size: 3.6, delay: -4.1 },
    { left: 90, top: 12, size: 2.4, delay: -1.3 },
    { left: 64, top: 30, size: 2.2, delay: -3.2 }
];

const Pumpkin: FC<{ size: string, delay: number }> = ({ size, delay }) => (
    <Box component='svg' viewBox='0 0 100 90' sx={{ width: size, filter: 'drop-shadow(0 0 18px rgba(255, 140, 30, 0.45))' }}>
        <ellipse cx='50' cy='54' rx='44' ry='33' fill='#E8590C' />
        <ellipse cx='30' cy='54' rx='22' ry='31' fill='#F76707' />
        <ellipse cx='70' cy='54' rx='22' ry='31' fill='#F76707' />
        <ellipse cx='50' cy='54' rx='17' ry='33' fill='#FD7E14' />
        <path d='M46 22 Q47 9 58 6 L60 10 Q52 13 54 23 Z' fill='#2B8A3E' />
        <Box
            component='g'
            sx={{
                fill: '#FFD43B',
                animation: `${flicker} 2.6s ${delay}s infinite`
            }}
        >
            <path d='M28 46 L38 34 L43 49 Z M72 46 L62 34 L57 49 Z M46 57 L50 50 L54 57 Z' />
            <path d='M26 63 L34 67 L38 61 L44 69 L50 62 L56 69 L62 61 L66 67 L74 63 Q66 82 50 82 Q34 82 26 63 Z' />
        </Box>
    </Box>
);

const Halloween: FC = () => (
    <>
        {/* A harvest moon behind the artwork */}
        <Box sx={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 80% 18%, rgba(255, 150, 50, 0.32) 0, rgba(255, 120, 30, 0.12) 9%, transparent 24%)', mixBlendMode: 'screen' }} />
        {BATS.map(bat => (
            <Box
                key={bat.left}
                sx={{
                    position: 'absolute',
                    left: `${bat.left}%`,
                    top: `${bat.top}%`,
                    width: `${bat.size}vw`,
                    minWidth: 22,
                    animation: `${batDrift} 7s ${bat.delay}s ease-in-out infinite alternate`
                }}
            >
                <Box
                    component='svg'
                    viewBox='0 0 100 42'
                    sx={{
                        display: 'block',
                        width: '100%',
                        fill: '#0b0b0b',
                        filter: 'drop-shadow(0 0 6px rgba(255, 117, 24, 0.55))',
                        transformOrigin: '50% 40%',
                        // Its own layer: the glow is drawn once and the flapping runs on the GPU
                        willChange: 'transform',
                        animation: `${flap} 0.32s ${bat.delay}s ease-in-out infinite alternate`
                    }}
                >
                    <path d={BAT_PATH} />
                </Box>
            </Box>
        ))}
        <Box sx={{ position: 'absolute', right: '4%', bottom: { xs: '12%', md: '26%' }, display: 'flex', alignItems: 'flex-end', gap: '0.6vw' }}>
            <Pumpkin size='clamp(48px, 5.5vw, 96px)' delay={0} />
            <Pumpkin size='clamp(34px, 3.8vw, 66px)' delay={-1.1} />
        </Box>
        <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, transparent, rgba(217, 72, 15, 0.16) 22%, transparent 55%)' }} />
    </>
);

const LIGHT_COLORS = [ '#ff3b3b', '#2ecc71', '#ffd43b', '#4dabf7' ];
/** Bulbs hang along a wire that sags between hooks; positions follow its curve. */
const BULBS = Array.from({ length: 4 * 5 }, (_, i) => {
    const segment = Math.floor(i / 5);
    const t = 0.1 + (i % 5) * 0.2;
    const y = (1 - t) ** 2 * 6 + 2 * (1 - t) * t * 54 + t ** 2 * 6;
    return { x: (segment + t) * 25, y, color: LIGHT_COLORS[i % LIGHT_COLORS.length], delay: -scatter(i, 3) * 3 };
});

const SNOWFLAKES = Array.from({ length: 48 }, (_, i) => ({
    left: scatter(i, 1) * 100,
    size: 2 + scatter(i, 2) * 5,
    duration: 9 + scatter(i, 4) * 10,
    delay: -scatter(i, 5) * 19,
    opacity: 0.45 + scatter(i, 6) * 0.5
}));

const Christmas: FC = () => (
    <>
        {SNOWFLAKES.map(flake => (
            <Box
                key={flake.left}
                sx={{
                    position: 'absolute',
                    top: '-2%',
                    left: `${flake.left}%`,
                    width: flake.size,
                    height: flake.size,
                    borderRadius: '50%',
                    backgroundColor: '#fff',
                    opacity: flake.opacity,
                    filter: flake.size > 5 ? 'blur(1px)' : undefined,
                    animation: `${snowfall} ${flake.duration}s ${flake.delay}s linear infinite`
                }}
            />
        ))}
        {/* String lights under the top bar */}
        <Box sx={{ position: 'absolute', left: 0, right: 0, top: { xs: 56, md: 68 }, height: 44 }}>
            <Box component='svg' viewBox='0 0 100 44' preserveAspectRatio='none' sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
                <path d='M0 6 Q12.5 54 25 6 Q37.5 54 50 6 Q62.5 54 75 6 Q87.5 54 100 6' stroke='#1f1f1f' strokeWidth='2' fill='none' vectorEffect='non-scaling-stroke' />
            </Box>
            {BULBS.map(bulb => (
                <Box
                    key={bulb.x}
                    sx={{
                        position: 'absolute',
                        left: `${bulb.x}%`,
                        top: bulb.y,
                        width: 9,
                        height: 14,
                        ml: '-4.5px',
                        borderRadius: '50% 50% 45% 45%',
                        backgroundColor: bulb.color,
                        boxShadow: `0 0 10px 3px ${bulb.color}`,
                        animation: `${twinkle} 1.8s ${bulb.delay}s ease-in-out infinite alternate`
                    }}
                />
            ))}
        </Box>
        <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, transparent, rgba(200, 16, 46, 0.14) 22%, transparent 55%)' }} />
    </>
);

const SUN_RAYS = Array.from({ length: 12 }, (_, i) => i * 30);

const Summer: FC = () => (
    <>
        <Box sx={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 84% 14%, rgba(255, 214, 80, 0.5) 0, rgba(255, 190, 60, 0.18) 8%, transparent 26%)', mixBlendMode: 'screen' }} />
        <Box
            component='svg'
            viewBox='-50 -50 100 100'
            sx={{
                position: 'absolute',
                right: '6%',
                top: '-6%',
                width: 'clamp(160px, 22vw, 380px)',
                opacity: 0.32,
                mixBlendMode: 'screen',
                animation: `${spin} 90s linear infinite`
            }}
        >
            {SUN_RAYS.map(angle => <path key={angle} d='M-3 -18 L0 -48 L3 -18 Z' fill='#FFE066' transform={`rotate(${angle})`} />)}
            <circle r='14' fill='#FFE066' />
        </Box>
        {[ 0, 1, 2, 3, 4, 5 ].map(i => (
            <Box
                key={i}
                sx={{
                    position: 'absolute',
                    left: `${55 + scatter(i, 7) * 40}%`,
                    top: `${20 + scatter(i, 8) * 45}%`,
                    width: `${1.5 + scatter(i, 9) * 3}vw`,
                    aspectRatio: '1',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(255, 236, 170, 0.5), transparent 70%)',
                    animation: `${drift} ${8 + i}s ${-i * 1.7}s ease-in-out infinite alternate`
                }}
            />
        ))}
        <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, transparent, rgba(14, 124, 134, 0.18) 22%, transparent 55%)' }} />
    </>
);

const DECOR: Partial<Record<Season, FC>> = { Halloween, Christmas, Summer };

/**
 * Seasonal artwork over the top of the home page. It never takes clicks, and stops moving when the device asks for
 * reduced motion.
 */
const SeasonalDecor: FC<{ season: Season | undefined, height?: string | object }> = ({ season, height = { xs: '72vh', md: '74vh' } }) => {
    const Decor = season && DECOR[season];
    if (!Decor) return null;
    return (
        <Box
            aria-hidden
            data-season={season}
            sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height,
                maxHeight: 820,
                overflow: 'hidden',
                pointerEvents: 'none',
                zIndex: 1,
                '@media (prefers-reduced-motion: reduce)': { '& *': { animation: 'none !important' } }
            }}
        >
            <Decor />
        </Box>
    );
};

export default SeasonalDecor;
