import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import ChevronLeft from '@mui/icons-material/ChevronLeft';
import ChevronRight from '@mui/icons-material/ChevronRight';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import React, { type FC, useCallback, useEffect, useRef, useState } from 'react';

import MediaCard from './MediaCard';

/** Page side gutter, matching Netflix's 4%. */
export const GUTTER = '4%';

/** How many posters fit across the row at each breakpoint (the next one peeks in, inviting a scroll). */
export const TILES_PER_ROW = { xs: 3, sm: 4, md: 6, lg: 7, xl: 8 };
const TILE_GAP = 8;

const tileWidthSx = Object.fromEntries(
    Object.entries(TILES_PER_ROW).map(([ bp, n ]) => [ bp, `calc((100% - ${(n - 1) * TILE_GAP}px) / ${n + 0.3})` ])
);

interface MediaRowProps {
    title: string
    items?: BaseItemDto[]
    isPending?: boolean
    primaryAction?: 'open' | 'play'
}

const ScrollButton: FC<{ direction: 'left' | 'right', onClick: () => void, hidden: boolean }> = ({ direction, onClick, hidden }) => (
    <ButtonBase
        className='mediaRow-arrow'
        onClick={onClick}
        tabIndex={-1}
        aria-hidden
        sx={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            [direction]: 0,
            width: GUTTER,
            zIndex: 3,
            // Phones swipe instead, and the gutter is too narrow there for the icon
            display: { xs: 'none', md: 'flex' },
            overflow: 'hidden',
            color: '#fff',
            background: 'rgba(20, 20, 20, 0.5)',
            opacity: 0,
            visibility: hidden ? 'hidden' : 'visible',
            transition: 'opacity 0.2s',
            '&:hover': { background: 'rgba(20, 20, 20, 0.7)', '& svg': { transform: 'scale(1.25)' } },
            '@media (hover: none)': { display: 'none' }
        }}
    >
        {direction === 'left' ? <ChevronLeft fontSize='large' /> : <ChevronRight fontSize='large' />}
    </ButtonBase>
);

/** A titled, horizontally scrolling row of tiles. Renders nothing once loaded if it has no items. */
const MediaRow: FC<MediaRowProps> = ({ title, items, isPending = false, primaryAction }) => {
    const scrollerRef = useRef<HTMLDivElement>(null);
    const [ canScrollLeft, setCanScrollLeft ] = useState(false);
    const [ canScrollRight, setCanScrollRight ] = useState(false);

    const updateArrows = useCallback(() => {
        const el = scrollerRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 4);
        setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    }, []);

    useEffect(() => {
        updateArrows();
        window.addEventListener('resize', updateArrows);
        return () => window.removeEventListener('resize', updateArrows);
    }, [ items, updateArrows ]);

    const scrollByPage = useCallback((direction: 1 | -1) => {
        const el = scrollerRef.current;
        el?.scrollBy({ left: direction * el.clientWidth * 0.9, behavior: 'smooth' });
    }, []);

    if (!isPending && !items?.length) return null;

    return (
        <Box
            component='section'
            aria-label={title}
            sx={{ mb: { xs: 2.5, md: 4 }, '&:hover .mediaRow-arrow': { opacity: 1 } }}
        >
            <Typography
                component='h2'
                sx={{ px: GUTTER, mb: 1, fontSize: { xs: '1rem', md: '1.4vw' }, fontWeight: 700, color: '#e5e5e5' }}
            >
                {title}
            </Typography>

            <Box sx={{ position: 'relative' }}>
                <ScrollButton direction='left' hidden={!canScrollLeft} onClick={() => scrollByPage(-1)} />
                <Box
                    ref={scrollerRef}
                    onScroll={updateArrows}
                    sx={{
                        display: 'flex',
                        gap: `${TILE_GAP}px`,
                        overflowX: 'auto',
                        overflowY: 'hidden',
                        scrollSnapType: 'x mandatory',
                        scrollPaddingInline: GUTTER,
                        px: GUTTER,
                        // Room for tiles to grow on hover without being clipped
                        py: '2.5%',
                        my: '-2.5%',
                        scrollbarWidth: 'none',
                        '&::-webkit-scrollbar': { display: 'none' }
                    }}
                >
                    {isPending ? (
                        Array.from({ length: 6 }, (_, i) => (
                            <Box key={i} sx={{ flex: '0 0 auto', width: tileWidthSx }}>
                                <Skeleton variant='rounded' sx={{ width: '100%', height: 'auto', aspectRatio: '2 / 3' }} />
                            </Box>
                        ))
                    ) : (
                        items?.map(item => (
                            <Box key={item.Id} sx={{ flex: '0 0 auto', width: tileWidthSx, scrollSnapAlign: 'start' }}>
                                <MediaCard item={item} primaryAction={primaryAction} />
                            </Box>
                        ))
                    )}
                </Box>
                <ScrollButton direction='right' hidden={!canScrollRight} onClick={() => scrollByPage(1)} />
            </Box>
        </Box>
    );
};

export default MediaRow;
