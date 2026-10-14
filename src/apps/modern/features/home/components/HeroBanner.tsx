import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import PlayArrow from '@mui/icons-material/PlayArrow';
import Star from '@mui/icons-material/Star';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import React, { type FC, useEffect, useState } from 'react';

import { useArtworkOverrides } from 'apps/modern/features/artwork/api/useArtwork';
import { useApi } from 'hooks/useApi';
import globalize from 'lib/globalize';

import { lightPillSx, pillSx, roundIconSx } from '../styles';
import { getBackdropUrl, getLogoUrl } from '../utils/images';
import { getMetaParts, hasTrailer, openItem, playItem, playTrailer } from '../utils/items';
import { GUTTER } from './MediaRow';

const ROTATE_INTERVAL_MS = 12_000;
const PAGE_BG = '#141414';

interface HeroBannerProps {
    items: BaseItemDto[]
}

/**
 * The featured title at the top of Home, laid out like Netflix's TV app: artwork on the right fading into the
 * page, title art and details on the left. Cycles through a few titles unless the user prefers reduced motion.
 */
const HeroBanner: FC<HeroBannerProps> = ({ items }) => {
    const { api } = useApi();
    useArtworkOverrides();
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
    const genres = item.Genres?.slice(0, 3) ?? [];
    const isSeries = item.Type === BaseItemKind.Series;

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
                height: { xs: '72vh', md: '74vh' },
                maxHeight: 820,
                minHeight: 460,
                overflow: 'hidden',
                backgroundColor: PAGE_BG
            }}
        >
            {/* Every backdrop stays mounted so switching cross-fades instead of flashing */}
            {items.map((heroItem, i) => (
                <Box
                    key={heroItem.Id}
                    aria-hidden
                    sx={{
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        right: 0,
                        width: { xs: '100%', md: '72%' },
                        backgroundImage: `url("${getBackdropUrl(api, heroItem)}")`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center top',
                        opacity: i === index ? 1 : 0,
                        transition: 'opacity 1s ease'
                    }}
                />
            ))}

            {/* Fade the artwork into the page on the left (behind the text) and at the bottom (into the rows) */}
            <Box
                aria-hidden
                sx={{
                    position: 'absolute',
                    inset: 0,
                    background: {
                        xs: `linear-gradient(0deg, ${PAGE_BG} 8%, rgba(20, 20, 20, 0.85) 35%, rgba(20, 20, 20, 0.2) 70%, rgba(20, 20, 20, 0.35) 100%)`,
                        md: `linear-gradient(90deg, ${PAGE_BG} 28%, rgba(20, 20, 20, 0.75) 40%, transparent 62%), linear-gradient(0deg, ${PAGE_BG} 0%, rgba(20, 20, 20, 0.75) 18%, rgba(20, 20, 20, 0.3) 36%, transparent 52%)`
                    }
                }}
            />

            <Box
                sx={{
                    position: 'absolute',
                    left: GUTTER,
                    right: GUTTER,
                    bottom: { xs: '14%', md: '24%' },
                    maxWidth: { xs: '100%', md: '36%' }
                }}
            >
                <Typography
                    component='div'
                    aria-hidden
                    sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, color: '#fff', fontSize: { xs: '0.8rem', md: '0.95rem' }, fontWeight: 600, letterSpacing: '0.35em' }}
                >
                    <Box component='span' sx={{ color: 'primary.main', fontSize: '1.9em', fontWeight: 900, letterSpacing: 0, lineHeight: 1, transform: 'scaleY(1.15)' }}>J</Box>
                    {globalize.translate(isSeries ? 'HeroKickerSeries' : 'HeroKickerFilm')}
                </Typography>

                {logoUrl ? (
                    <Box
                        component='img'
                        src={logoUrl}
                        alt={item.Name ?? ''}
                        sx={{ display: 'block', maxWidth: '100%', maxHeight: { xs: 90, md: '11vw' }, mb: 2.5, objectFit: 'contain', objectPosition: 'left bottom' }}
                    />
                ) : (
                    <Typography
                        component='h1'
                        sx={{ mb: 2, fontSize: { xs: '2.2rem', md: '3.6vw' }, fontWeight: 900, lineHeight: 1.05, color: '#fff', textTransform: 'uppercase', letterSpacing: '-0.01em' }}
                    >
                        {item.Name}
                    </Typography>
                )}

                {item.CommunityRating != null && (
                    <Stack direction='row' spacing={0.75} sx={{ alignItems: 'center', mb: 1, color: '#fff' }}>
                        <Star sx={{ color: 'starIcon.main', fontSize: '1.4rem' }} />
                        <Typography sx={{ fontSize: { xs: '1rem', md: '1.25rem' }, fontWeight: 600 }}>
                            {item.CommunityRating.toFixed(1)}/10
                        </Typography>
                    </Stack>
                )}

                {meta.length > 0 && (
                    <Typography sx={{ mb: 0.5, color: '#fff', fontSize: { xs: '0.95rem', md: '1.05rem' }, fontWeight: 500 }}>
                        {meta.join(' · ')}
                    </Typography>
                )}

                {genres.length > 0 && (
                    <Typography sx={{ mb: 1.5, color: 'text.secondary', fontSize: { xs: '0.9rem', md: '1rem' } }}>
                        {genres.join(' • ')}
                    </Typography>
                )}

                {item.Overview && (
                    <Typography
                        sx={{
                            display: { xs: 'none', md: '-webkit-box' },
                            mb: 3,
                            color: 'rgba(255, 255, 255, 0.85)',
                            fontSize: '1rem',
                            lineHeight: 1.45,
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                        }}
                    >
                        {item.Overview}
                    </Typography>
                )}

                <Stack direction='row' spacing={2} sx={{ alignItems: 'center', mt: { xs: 2, md: 0 } }}>
                    <Button
                        startIcon={<PlayArrow sx={{ fontSize: '1.6em !important' }} />}
                        onClick={() => playItem(item)}
                        color='primary'
                        sx={pillSx}
                    >
                        {globalize.translate('Play')}
                    </Button>

                    {hasTrailer(item) ? (
                        <>
                            <Button
                                onClick={() => playTrailer(item)}
                                sx={lightPillSx}
                            >
                                {globalize.translate('WatchTrailer')}
                            </Button>
                            <IconButton
                                onClick={() => openItem(item)}
                                aria-label={globalize.translate('MoreInfo')}
                                sx={roundIconSx}
                            >
                                <InfoOutlined />
                            </IconButton>
                        </>
                    ) : (
                        <Button
                            startIcon={<InfoOutlined />}
                            onClick={() => openItem(item)}
                            sx={lightPillSx}
                        >
                            {globalize.translate('MoreInfo')}
                        </Button>
                    )}
                </Stack>
            </Box>

            {items.length > 1 && (
                <Stack
                    direction='row'
                    spacing={1}
                    sx={{ position: 'absolute', right: GUTTER, bottom: '22%', display: { xs: 'none', md: 'flex' } }}
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
