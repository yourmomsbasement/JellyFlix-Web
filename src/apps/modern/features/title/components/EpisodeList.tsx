import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import PlayArrow from '@mui/icons-material/PlayArrow';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import LinearProgress from '@mui/material/LinearProgress';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import React, { type FC } from 'react';

import { useApi } from 'hooks/useApi';
import globalize from 'lib/globalize';

import { getStillUrl } from '../../home/utils/images';
import { getPlayedPercentage, playItem } from '../../home/utils/items';
import { useEpisodes } from '../api/useTitle';

const TICKS_PER_MINUTE = 600_000_000;

interface EpisodeListProps {
    series: BaseItemDto
    seasons: BaseItemDto[]
    seasonId: string | undefined
    onSeasonChange: (seasonId: string) => void
    /** The episode Play would start, highlighted in the list. */
    currentEpisodeId?: string | null
}

const EpisodeRow: FC<{ episode: BaseItemDto, isCurrent: boolean }> = ({ episode, isCurrent }) => {
    const { api } = useApi();
    const stillUrl = getStillUrl(api, episode);
    const progress = getPlayedPercentage(episode);
    const minutes = episode.RunTimeTicks ? Math.round(episode.RunTimeTicks / TICKS_PER_MINUTE) : undefined;

    return (
        <ButtonBase
            component='li'
            onClick={() => playItem(episode)}
            aria-label={`${globalize.translate('Play')} ${episode.IndexNumber ?? ''} ${episode.Name ?? ''}`}
            focusRipple
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: { xs: 1.5, md: 3 },
                width: '100%',
                p: { xs: 1.5, md: 2.5 },
                textAlign: 'left',
                borderRadius: 1,
                borderBottom: '1px solid #404040',
                backgroundColor: isCurrent ? '#333' : 'transparent',
                '&:hover, &.Mui-focusVisible': { backgroundColor: '#2a2a2a', '& .episodeRow-play': { opacity: 1 } }
            }}
        >
            <Typography sx={{ display: { xs: 'none', sm: 'block' }, flex: '0 0 2.5rem', textAlign: 'center', fontSize: '1.6rem', color: '#d2d2d2' }}>
                {episode.IndexNumber}
            </Typography>

            <Box sx={{ position: 'relative', flex: '0 0 auto', width: { xs: 130, md: 200 }, aspectRatio: '16 / 9', borderRadius: 1, overflow: 'hidden', backgroundColor: '#2f2f2f' }}>
                {stillUrl && <Box component='img' src={stillUrl} alt='' loading='lazy' sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                <Box
                    className='episodeRow-play'
                    sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s', backgroundColor: 'rgba(0, 0, 0, 0.35)' }}
                >
                    <PlayArrow sx={{ fontSize: '2.4rem', color: '#fff', border: '2px solid #fff', borderRadius: '50%', backgroundColor: 'rgba(0, 0, 0, 0.5)' }} />
                </Box>
                {progress > 0 && (
                    <LinearProgress
                        variant='determinate'
                        value={progress}
                        aria-hidden
                        sx={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 4, backgroundColor: 'rgba(255, 255, 255, 0.3)', '& .MuiLinearProgress-bar': { backgroundColor: 'primary.main' } }}
                    />
                )}
            </Box>

            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction='row' sx={{ justifyContent: 'space-between', gap: 2, mb: 0.75 }}>
                    <Typography sx={{ fontWeight: 700, color: '#fff' }} noWrap>
                        <Box component='span' sx={{ display: { sm: 'none' } }}>{episode.IndexNumber}. </Box>
                        {episode.Name}
                    </Typography>
                    {minutes != null && <Typography sx={{ color: '#fff', flexShrink: 0 }}>{minutes}m</Typography>}
                </Stack>
                {episode.Overview && (
                    <Typography
                        sx={{
                            color: '#d2d2d2',
                            fontSize: '0.9rem',
                            lineHeight: 1.45,
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                        }}
                    >
                        {episode.Overview}
                    </Typography>
                )}
            </Box>
        </ButtonBase>
    );
};

/** Netflix's episode list: a season picker and one row per episode. Clicking an episode plays it. */
const EpisodeList: FC<EpisodeListProps> = ({ series, seasons, seasonId, onSeasonChange, currentEpisodeId }) => {
    const { data: episodes, isPending } = useEpisodes(series.Id ?? undefined, seasonId);
    const season = seasons.find(s => s.Id === seasonId);

    return (
        <Box component='section' aria-label={globalize.translate('Episodes')}>
            <Stack direction='row' sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 2, gap: 2 }}>
                <Typography component='h2' sx={{ fontSize: { xs: '1.3rem', md: '1.6rem' }, fontWeight: 700, color: '#fff' }}>
                    {globalize.translate('Episodes')}
                </Typography>
                {seasons.length > 1 ? (
                    <Select
                        size='small'
                        variant='outlined'
                        value={seasonId ?? ''}
                        onChange={e => onSeasonChange(e.target.value)}
                        inputProps={{ 'aria-label': globalize.translate('Season') }}
                        sx={{ minWidth: 160, fontWeight: 600, backgroundColor: '#242424', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#4d4d4d' } }}
                    >
                        {seasons.map(s => (
                            <MenuItem key={s.Id} value={s.Id ?? ''}>{s.Name}</MenuItem>
                        ))}
                    </Select>
                ) : (
                    season && <Typography sx={{ color: 'text.secondary', fontWeight: 600 }}>{season.Name}</Typography>
                )}
            </Stack>

            <Box component='ul' sx={{ p: 0, m: 0, listStyle: 'none' }}>
                {isPending ? (
                    Array.from({ length: 3 }, (_, i) => <Skeleton key={i} variant='rounded' height={120} sx={{ mb: 1 }} />)
                ) : (
                    episodes?.map(episode => <EpisodeRow key={episode.Id} episode={episode} isCurrent={episode.Id === currentEpisodeId} />)
                )}
            </Box>
        </Box>
    );
};

export default EpisodeList;
