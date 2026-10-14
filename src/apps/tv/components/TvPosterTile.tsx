import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import Box from '@mui/material/Box';
import React, { type FC, type KeyboardEvent } from 'react';

import { useArtworkOverrides } from 'apps/modern/features/artwork/api/useArtwork';
import { getPosterUrl } from 'apps/modern/features/home/utils/images';
import { getDisplayTitle, getEpisodeLabel, getPlayedPercentage, openItem, playItem } from 'apps/modern/features/home/utils/items';
import { useApi } from 'hooks/useApi';
import { getKeyName } from 'scripts/keyboardNavigation';

import { focusRingSx, POSTER_HEIGHT, POSTER_WIDTH } from '../styles';

interface TvPosterTileProps {
    item: BaseItemDto
    onFocusItem?: (item: BaseItemDto) => void
    /** What OK does; opens the title by default. */
    onSelect?: (item: BaseItemDto) => void
}

/** The remote's play keys start a tile straight away, as on Netflix. */
export const onPlayKey = (item: BaseItemDto) => (e: KeyboardEvent) => {
    const key = getKeyName(e.nativeEvent);
    if (key === 'MediaPlay' || key === 'MediaPlayPause') {
        e.preventDefault();
        e.stopPropagation();
        playItem(item);
    }
};

/** A 2:3 poster in a TV row. */
const TvPosterTile: FC<TvPosterTileProps> = ({ item, onFocusItem, onSelect = openItem }) => {
    const { api } = useApi();
    useArtworkOverrides();
    const posterUrl = getPosterUrl(api, item, 360);
    const progress = getPlayedPercentage(item);
    const episode = getEpisodeLabel(item);
    const title = getDisplayTitle(item);

    return (
        <Box
            component='button'
            type='button'
            data-tv-item
            aria-label={episode ? `${title} ${episode}` : title}
            onFocus={() => onFocusItem?.(item)}
            onClick={() => onSelect(item)}
            onKeyDown={onPlayKey(item)}
            sx={{
                ...focusRingSx,
                position: 'relative',
                flex: '0 0 auto',
                width: POSTER_WIDTH,
                height: POSTER_HEIGHT,
                p: 0,
                border: 0,
                borderRadius: '0.35vw',
                overflow: 'hidden',
                backgroundColor: '#2a2a2a',
                cursor: 'pointer'
            }}
        >
            {posterUrl ? (
                <Box component='img' src={posterUrl} alt='' loading='lazy' sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            ) : (
                <Box sx={{ p: '0.8vw', color: '#fff', fontSize: '1.1vw', fontWeight: 600, textAlign: 'left' }}>{title}</Box>
            )}

            {episode && (
                <Box
                    sx={{
                        position: 'absolute',
                        left: '0.5vw',
                        bottom: progress > 0 ? '0.9vw' : '0.5vw',
                        px: '0.4vw',
                        borderRadius: '0.2vw',
                        backgroundColor: 'rgba(0, 0, 0, 0.75)',
                        color: '#fff',
                        fontSize: '0.85vw',
                        fontWeight: 600
                    }}
                >
                    {episode}
                </Box>
            )}

            {progress > 0 && (
                <Box sx={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '0.35vw', backgroundColor: 'rgba(255, 255, 255, 0.3)' }}>
                    <Box sx={{ width: `${progress}%`, height: '100%', backgroundColor: 'primary.main' }} />
                </Box>
            )}
        </Box>
    );
};

export default TvPosterTile;
