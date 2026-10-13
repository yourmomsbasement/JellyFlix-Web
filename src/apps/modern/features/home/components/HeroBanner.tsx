import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import PlayArrow from '@mui/icons-material/PlayArrow';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import React, { type FC, useEffect, useState } from 'react';

import { useApi } from 'hooks/useApi';
import globalize from 'lib/globalize';

import { getBackdropUrl, getLogoUrl } from '../utils/images';
import { getMetaParts, openItem, playItem } from '../utils/items';
import { GUTTER } from './MediaRow';

const ROTATE_INTERVAL_MS = 10_000;

interface HeroBannerProps {
    items: BaseItemDto[]
}

/** The big featured title at the top of Home. Cycles through a few titles unless the user prefers reduced motion. */
const HeroBanner: FC<HeroBannerProps> = ({ items }) => {
    const { api } = useApi();
    const [ index, setIndex ] = useState(0);
    const [ isPaused, setIsPaused ] = useState(false);
    const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

    useEffect(() => {
        if (items.length < 2 || isPaused || prefersReducedMotion) return;
        const timer = window.setInterval(() => setIndex(i => (i + 1) % items.length), ROTATE_INTERVAL_MS);
        return () => window.clearInterval(timer);
    }, [ items.length, isPaused, prefersReducedMotion ]);

    const item = items[index % items.length];
    if (!item) return null;

    const logoUrl = getLogoUrl(api, item);
    const meta = getMetaParts(item);

    return (
        <Box
            component='section'
            aria-roledescription='carousel'
            aria-label={globalize.translate('Featured')}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onFocus={() => setIsPaused(true)}
            onBlur={() => setIsPaused(false)}
            sx={{
                position: 'relative',
                height: { xs: '70vh', md: '56.25vw' },
                maxHeight: '90vh',
                minHeight: 420,
                overflow: 'hidden'
            }}
        >
            {/* Every backdrop stays mounted so switching cross-fades instead of flashing */}
            {items.map((heroItem, i) => (
                <Box
                    key={heroItem.Id}
                    aria-hidden
                    sx={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage: `url("${getBackdropUrl(api, heroItem)}")`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center top',
                        opacity: i === index ? 1 : 0,
                        transition: 'opacity 1s ease'
                    }}
                />
            ))}

            {/* Vignettes: darken the left for the text and fade the bottom into the page */}
            <Box
                aria-hidden
                sx={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(77deg, rgba(0, 0, 0, 0.65) 0%, transparent 70%), linear-gradient(0deg, #141414 0%, rgba(20, 20, 20, 0.75) 15%, rgba(20, 20, 20, 0.3) 32%, transparent 45%)'
                }}
            />

            <Box
                sx={{
                    position: 'absolute',
                    left: GUTTER,
                    right: GUTTER,
                    bottom: { xs: '18%', md: '32%' },
                    maxWidth: { xs: '100%', md: '40%' }
                }}
            >
                {logoUrl ? (
                    <Box
                        component='img'
                        src={logoUrl}
                        alt={item.Name ?? ''}
                        sx={{ display: 'block', maxWidth: '100%', maxHeight: { xs: 100, md: '14vw' }, mb: 2, objectFit: 'contain', objectPosition: 'left bottom' }}
                    />
                ) : (
                    <Typography
                        component='h1'
                        sx={{ mb: 1.5, fontSize: { xs: '2rem', md: '4vw' }, fontWeight: 900, lineHeight: 1.05, color: '#fff', textShadow: '2px 2px 4px rgba(0, 0, 0, 0.45)' }}
                    >
                        {item.Name}
                    </Typography>
                )}

                {meta.length > 0 && (
                    <Typography sx={{ mb: 1, color: '#fff', fontSize: { xs: '0.9rem', md: '1.1vw' }, fontWeight: 500, textShadow: '1px 1px 2px rgba(0, 0, 0, 0.6)' }}>
                        {meta.join(' · ')}
                    </Typography>
                )}

                {item.Overview && (
                    <Typography
                        sx={{
                            display: { xs: 'none', sm: '-webkit-box' },
                            mb: 2.5,
                            color: '#fff',
                            fontSize: { sm: '1rem', md: '1.2vw' },
                            lineHeight: 1.4,
                            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.45)',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                        }}
                    >
                        {item.Overview}
                    </Typography>
                )}

                <Stack direction='row' spacing={1.5}>
                    <Button
                        size='large'
                        startIcon={<PlayArrow sx={{ fontSize: '1.8em !important' }} />}
                        onClick={() => playItem(item)}
                        sx={{
                            px: { xs: 2.5, md: 3.5 },
                            fontWeight: 700,
                            color: '#000',
                            backgroundColor: '#fff',
                            '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.75)' }
                        }}
                    >
                        {globalize.translate('Play')}
                    </Button>
                    <Button
                        size='large'
                        startIcon={<InfoOutlined />}
                        onClick={() => openItem(item)}
                        sx={{
                            px: { xs: 2.5, md: 3.5 },
                            fontWeight: 700,
                            color: '#fff',
                            backgroundColor: 'rgba(109, 109, 110, 0.7)',
                            '&:hover': { backgroundColor: 'rgba(109, 109, 110, 0.4)' }
                        }}
                    >
                        {globalize.translate('MoreInfo')}
                    </Button>
                </Stack>
            </Box>

            {items.length > 1 && (
                <Stack
                    direction='row'
                    spacing={1}
                    sx={{ position: 'absolute', right: GUTTER, bottom: { xs: '8%', md: '30%' } }}
                >
                    {items.map((heroItem, i) => (
                        <ButtonBase
                            key={heroItem.Id}
                            onClick={() => setIndex(i)}
                            aria-label={heroItem.Name ?? ''}
                            aria-current={i === index}
                            sx={{
                                width: 14,
                                height: 3,
                                backgroundColor: i === index ? '#fff' : 'rgba(255, 255, 255, 0.35)',
                                transition: 'background-color 0.3s'
                            }}
                        />
                    ))}
                </Stack>
            )}
        </Box>
    );
};

export default HeroBanner;
