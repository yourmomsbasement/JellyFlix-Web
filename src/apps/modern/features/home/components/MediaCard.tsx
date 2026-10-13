import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import PlayArrow from '@mui/icons-material/PlayArrow';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import React, { type FC, type MouseEvent, useCallback } from 'react';

import { useApi } from 'hooks/useApi';
import globalize from 'lib/globalize';

import type { WatchAction } from '../api/useWatchActions';
import { getPosterUrl } from '../utils/images';
import { getDisplayTitle, getEpisodeLabel, getMetaParts, getPlayedPercentage, openItem, playItem } from '../utils/items';
import WatchMenu from './WatchMenu';

interface MediaCardProps {
    item: BaseItemDto
    /** What clicking the tile does. Continue Watching tiles resume playback, like Netflix. */
    primaryAction?: 'open' | 'play'
    /** Housekeeping options in the tile's "⋮" menu, e.g. "Mark as watched" in Continue Watching. */
    watchActions?: WatchAction[]
}

/** A 2:3 poster tile. It grows on hover and reveals a play button and the title details. */
const MediaCard: FC<MediaCardProps> = ({ item, primaryAction = 'open', watchActions }) => {
    const { api } = useApi();
    const posterUrl = getPosterUrl(api, item);
    const title = getDisplayTitle(item);
    const episodeLabel = getEpisodeLabel(item);
    // Folders (series, seasons) report how many episodes were watched; only show progress within a single video
    const progress = item.IsFolder ? 0 : getPlayedPercentage(item);

    const onClick = useCallback(() => {
        if (primaryAction === 'play') playItem(item);
        else openItem(item);
    }, [ item, primaryAction ]);

    const onPlayClick = useCallback((e: MouseEvent) => {
        e.stopPropagation();
        playItem(item);
    }, [ item ]);

    return (
        <Box
            className='mediaCard'
            sx={{
                position: 'relative',
                transition: 'transform 0.3s ease 0.1s',
                '@media (hover: hover)': {
                    '&:hover, &:focus-within': {
                        transform: 'scale(1.08)',
                        zIndex: 2,
                        '& .mediaCard-details, & .mediaCard-menu': { opacity: 1 }
                    }
                }
            }}
        >
            <ButtonBase
                onClick={onClick}
                aria-label={episodeLabel ? `${title} ${episodeLabel} ${item.Name ?? ''}` : title}
                focusRipple
                sx={{
                    display: 'block',
                    width: '100%',
                    aspectRatio: '2 / 3',
                    borderRadius: 1,
                    overflow: 'hidden',
                    backgroundColor: 'background.paper',
                    textAlign: 'left',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
                    '&.Mui-focusVisible': { outline: '3px solid', outlineColor: 'text.primary' }
                }}
            >
                {posterUrl && (
                    <Box
                        component='img'
                        src={posterUrl}
                        alt=''
                        loading='lazy'
                        sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                )}

                {/* Without a poster, or for an episode, say what this is; posters carry their own title art */}
                {(!posterUrl || episodeLabel) && (
                    <Box
                        sx={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'flex-end',
                            p: 1,
                            background: posterUrl ? 'linear-gradient(0deg, rgba(0, 0, 0, 0.85) 0%, transparent 35%)' : undefined
                        }}
                    >
                        {!posterUrl && (
                            <Typography sx={{ fontWeight: 700, fontSize: '1rem', lineHeight: 1.2, color: '#fff' }}>
                                {title}
                            </Typography>
                        )}
                        {episodeLabel && (
                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#fff' }} noWrap>
                                {episodeLabel} {item.Name}
                            </Typography>
                        )}
                    </Box>
                )}

                {/* Hover details */}
                <Box
                    className='mediaCard-details'
                    sx={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-end',
                        p: 1,
                        opacity: 0,
                        transition: 'opacity 0.3s ease 0.1s',
                        background: 'linear-gradient(0deg, rgba(0, 0, 0, 0.95) 0%, rgba(0, 0, 0, 0.6) 45%, rgba(0, 0, 0, 0.15) 100%)'
                    }}
                >
                    <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', lineHeight: 1.2, color: '#fff' }}>
                        {title}
                    </Typography>
                    {episodeLabel && (
                        <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.85)' }} noWrap>
                            {episodeLabel} {item.Name}
                        </Typography>
                    )}
                    <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.75)' }} noWrap>
                        {getMetaParts(item).join(' · ')}
                    </Typography>
                </Box>
            </ButtonBase>

            {/* Kept outside the tile button so it is its own control */}
            <IconButton
                className='mediaCard-details'
                onClick={onPlayClick}
                aria-label={globalize.translate('Play')}
                sx={{
                    position: 'absolute',
                    top: '38%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    opacity: 0,
                    transition: 'opacity 0.3s ease 0.1s',
                    color: '#141414',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    '&:hover': { backgroundColor: '#fff' },
                    '&.Mui-focusVisible': { opacity: 1 },
                    '@media (hover: none)': { display: 'none' }
                }}
            >
                <PlayArrow />
            </IconButton>

            {watchActions && <WatchMenu item={item} actions={watchActions} />}

            {progress > 0 && (
                <LinearProgress
                    variant='determinate'
                    value={progress}
                    aria-label={globalize.translate('ButtonResume')}
                    sx={{
                        mt: 0.75,
                        height: 3,
                        borderRadius: 0,
                        backgroundColor: 'rgba(255, 255, 255, 0.25)',
                        '& .MuiLinearProgress-bar': { backgroundColor: 'primary.main' }
                    }}
                />
            )}
        </Box>
    );
};

export default MediaCard;
