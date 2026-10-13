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

import { getLandscapeImageUrl, hasTitleInArtwork } from '../utils/images';
import { getDisplayTitle, getEpisodeLabel, getMetaParts, getPlayedPercentage, openItem, playItem } from '../utils/items';

interface MediaCardProps {
    item: BaseItemDto
    /** What clicking the tile does. Continue Watching tiles resume playback, like Netflix. */
    primaryAction?: 'open' | 'play'
}

/** A 16:9 row tile. It grows on hover and reveals a play button and the title details. */
const MediaCard: FC<MediaCardProps> = ({ item, primaryAction = 'open' }) => {
    const { api } = useApi();
    const imageUrl = getLandscapeImageUrl(api, item);
    const title = getDisplayTitle(item);
    const episodeLabel = getEpisodeLabel(item);
    // Folders (series, seasons) report how many episodes were watched; only show progress within a single video
    const progress = item.IsFolder ? 0 : getPlayedPercentage(item);
    const showTitle = !hasTitleInArtwork(item);

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
                        '& .mediaCard-details': { opacity: 1 }
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
                    aspectRatio: '16 / 9',
                    borderRadius: 1,
                    overflow: 'hidden',
                    backgroundColor: 'background.paper',
                    textAlign: 'left',
                    '&.Mui-focusVisible': { outline: '3px solid', outlineColor: 'text.primary' }
                }}
            >
                {imageUrl && (
                    <Box
                        component='img'
                        src={imageUrl}
                        alt=''
                        loading='lazy'
                        sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                )}

                {/* Title label for artwork that doesn't include the name */}
                {(showTitle || !imageUrl) && (
                    <Box
                        sx={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'flex-end',
                            p: 1.25,
                            background: 'linear-gradient(0deg, rgba(0, 0, 0, 0.75) 0%, transparent 55%)'
                        }}
                    >
                        <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.2, color: '#fff', textShadow: '0 1px 3px rgba(0, 0, 0, 0.6)' }} noWrap>
                            {title}
                        </Typography>
                        {episodeLabel && (
                            <Typography sx={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.85)' }} noWrap>
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
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0,
                        transition: 'opacity 0.3s ease 0.1s',
                        background: 'rgba(0, 0, 0, 0.35)'
                    }}
                >
                    <Box sx={{ position: 'absolute', left: 10, right: 10, top: 8 }}>
                        <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.9)' }} noWrap>
                            {getMetaParts(item).join(' · ')}
                        </Typography>
                    </Box>
                </Box>
            </ButtonBase>

            {/* Kept outside the tile button so it is its own control */}
            <IconButton
                className='mediaCard-details'
                onClick={onPlayClick}
                aria-label={globalize.translate('Play')}
                sx={{
                    position: 'absolute',
                    top: '50%',
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

            {progress > 0 && (
                <LinearProgress
                    variant='determinate'
                    value={progress}
                    aria-label={globalize.translate('ButtonResume')}
                    sx={{
                        mt: 0.75,
                        mx: '10%',
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
