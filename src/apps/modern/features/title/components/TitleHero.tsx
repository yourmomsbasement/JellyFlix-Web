import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import Add from '@mui/icons-material/Add';
import Check from '@mui/icons-material/Check';
import MoreHoriz from '@mui/icons-material/MoreHoriz';
import PlayArrow from '@mui/icons-material/PlayArrow';
import ThumbDownAlt from '@mui/icons-material/ThumbDownAlt';
import ThumbDownOffAlt from '@mui/icons-material/ThumbDownOffAlt';
import ThumbUpAlt from '@mui/icons-material/ThumbUpAlt';
import ThumbUpOffAlt from '@mui/icons-material/ThumbUpOffAlt';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import React, { type FC, useState } from 'react';

import { useArtworkOverrides } from 'apps/modern/features/artwork/api/useArtwork';
import ArtworkDialog from 'apps/modern/features/artwork/components/ArtworkDialog';
import { appRouter } from 'components/router/appRouter';
import { useApi } from 'hooks/useApi';
import globalize from 'lib/globalize';

import { GUTTER } from '../../home/components/MediaRow';
import { lightPillSx, MATCH_GREEN, pillSx, roundIconSx } from '../../home/styles';
import { getBackdropUrl, getLogoUrl } from '../../home/utils/images';
import { getEpisodeLabel, getMetaParts, hasTrailer, playItem, playTrailer } from '../../home/utils/items';
import { useTitleActions } from '../api/useTitle';

const TICKS_PER_MINUTE = 600_000_000;

interface TitleHeroProps {
    item: BaseItemDto
    /** What Play starts: the movie, or the show's current/next episode. */
    playTarget: BaseItemDto | null | undefined
    match: number | null | undefined
    /** Quality badges such as "4K" and "Dolby Vision". */
    badges?: string[]
}

export const getPlayLabel = (target: BaseItemDto | null | undefined) => {
    if (!target) return globalize.translate('Play');
    const isStarted = (target.UserData?.PlaybackPositionTicks ?? 0) > 0;
    const episode = getEpisodeLabel(target);
    if (episode) {
        if (isStarted) return globalize.translate('ResumeEpisode', episode);
        // Starting a show from the top just says "Play"
        if (target.ParentIndexNumber !== 1 || target.IndexNumber !== 1) return globalize.translate('PlayEpisode', episode);
        return globalize.translate('Play');
    }
    return globalize.translate(isStarted ? 'ButtonResume' : 'Play');
};

/** The top of a title page: big artwork, title art, match and the actions. */
const TitleHero: FC<TitleHeroProps> = ({ item, playTarget, match, badges = [] }) => {
    const { api } = useApi();
    const actions = useTitleActions(item);
    const [ menuAnchor, setMenuAnchor ] = useState<HTMLElement | null>(null);
    const [ isArtworkOpen, setIsArtworkOpen ] = useState(false);
    const overrides = useArtworkOverrides();

    const logoUrl = getLogoUrl(api, item);
    const isSeries = item.Type === BaseItemKind.Series;
    const likes = item.UserData?.Likes;
    const isFavorite = !!item.UserData?.IsFavorite;
    const isPlayed = !!item.UserData?.Played;

    // Progress of whatever Play resumes
    const position = playTarget?.UserData?.PlaybackPositionTicks ?? 0;
    const runtime = playTarget?.RunTimeTicks ?? 0;
    const remainingMinutes = runtime > position ? Math.round((runtime - position) / TICKS_PER_MINUTE) : 0;

    return (
        <Box
            component='section'
            sx={{
                position: 'relative',
                height: { xs: '78vh', md: '70vh' },
                maxHeight: 820,
                minHeight: 520,
                overflow: 'hidden',
                backgroundColor: 'var(--jf-palette-background-default)'
            }}
        >
            <Box
                aria-hidden
                sx={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: `url("${getBackdropUrl(api, item)}")`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center top'
                }}
            />
            <Box
                aria-hidden
                sx={{
                    position: 'absolute',
                    inset: 0,
                    background: {
                        xs: 'linear-gradient(0deg, var(--jf-palette-background-default) 10%, rgb(var(--jf-palette-background-defaultChannel) / 0.85) 40%, rgb(var(--jf-palette-background-defaultChannel) / 0.25) 75%, rgb(var(--jf-palette-background-defaultChannel) / 0.4) 100%)',
                        md: 'linear-gradient(90deg, rgb(var(--jf-palette-background-defaultChannel) / 0.95) 0%, rgb(var(--jf-palette-background-defaultChannel) / 0.7) 30%, transparent 60%), linear-gradient(0deg, var(--jf-palette-background-default) 0%, rgb(var(--jf-palette-background-defaultChannel) / 0.6) 15%, transparent 40%)'
                    }
                }}
            />

            <Box sx={{ position: 'absolute', left: GUTTER, right: GUTTER, bottom: { xs: '5%', md: '10%' }, maxWidth: { md: '42%' } }}>
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
                        sx={{ display: 'block', maxWidth: '100%', maxHeight: { xs: 100, md: '12vw' }, mb: 2, objectFit: 'contain', objectPosition: 'left bottom' }}
                    />
                ) : (
                    <Typography
                        component='h1'
                        sx={{ mb: 2, fontSize: { xs: '2.2rem', md: '3.8vw' }, fontWeight: 900, lineHeight: 1.05, color: '#fff', textTransform: 'uppercase' }}
                    >
                        {item.Name}
                    </Typography>
                )}

                <Stack direction='row' spacing={1.25} useFlexGap sx={{ alignItems: 'center', flexWrap: 'wrap', mb: 2, color: '#fff', fontSize: { xs: '0.95rem', md: '1.05rem' } }}>
                    {match != null && (
                        <Typography component='span' sx={{ color: MATCH_GREEN, fontWeight: 700, fontSize: 'inherit' }}>
                            {globalize.translate('MatchPercent', String(match))}
                        </Typography>
                    )}
                    {getMetaParts(item).map(part => (
                        part === item.OfficialRating ? (
                            <Box key={part} component='span' sx={{ px: 0.75, border: '1px solid rgba(255, 255, 255, 0.6)', fontSize: '0.85em', lineHeight: 1.5 }}>{part}</Box>
                        ) : (
                            <Typography key={part} component='span' sx={{ fontSize: 'inherit' }}>{part}</Typography>
                        )
                    ))}
                    {badges.map(badge => (
                        <Box
                            key={badge}
                            component='span'
                            sx={{ px: 0.6, borderRadius: 0.5, border: '1px solid rgba(255, 255, 255, 0.6)', color: '#e5e5e5', fontSize: '0.75em', fontWeight: 600, lineHeight: 1.5 }}
                        >
                            {badge}
                        </Box>
                    ))}
                </Stack>

                <Stack direction='row' spacing={{ xs: 1, md: 1.5 }} useFlexGap sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                    <Button
                        startIcon={<PlayArrow sx={{ fontSize: '1.6em !important' }} />}
                        onClick={() => playTarget && playItem(playTarget)}
                        disabled={!playTarget}
                        sx={pillSx}
                    >
                        {getPlayLabel(playTarget)}
                    </Button>

                    {hasTrailer(item) && (
                        <Button onClick={() => playTrailer(item)} sx={lightPillSx}>
                            {globalize.translate('WatchTrailer')}
                        </Button>
                    )}

                    <Tooltip title={globalize.translate(isFavorite ? 'RemoveFromMyList' : 'AddToMyList')}>
                        <IconButton
                            aria-label={globalize.translate(isFavorite ? 'RemoveFromMyList' : 'AddToMyList')}
                            aria-pressed={isFavorite}
                            onClick={() => actions.mutate('toggleFavorite')}
                            sx={roundIconSx}
                        >
                            {isFavorite ? <Check /> : <Add />}
                        </IconButton>
                    </Tooltip>
                    <Tooltip title={globalize.translate('ILikeThis')}>
                        <IconButton
                            aria-label={globalize.translate('ILikeThis')}
                            aria-pressed={likes === true}
                            onClick={() => actions.mutate(likes === true ? 'clearRating' : 'like')}
                            sx={roundIconSx}
                        >
                            {likes === true ? <ThumbUpAlt /> : <ThumbUpOffAlt />}
                        </IconButton>
                    </Tooltip>
                    <Tooltip title={globalize.translate('NotForMe')}>
                        <IconButton
                            aria-label={globalize.translate('NotForMe')}
                            aria-pressed={likes === false}
                            onClick={() => actions.mutate(likes === false ? 'clearRating' : 'dislike')}
                            sx={roundIconSx}
                        >
                            {likes === false ? <ThumbDownAlt /> : <ThumbDownOffAlt />}
                        </IconButton>
                    </Tooltip>
                    <Tooltip title={globalize.translate('ButtonMore')}>
                        <IconButton
                            aria-label={globalize.translate('ButtonMore')}
                            aria-haspopup='true'
                            onClick={e => setMenuAnchor(e.currentTarget)}
                            sx={roundIconSx}
                        >
                            <MoreHoriz />
                        </IconButton>
                    </Tooltip>
                    <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={() => setMenuAnchor(null)}>
                        <MenuItem
                            onClick={() => {
                                setMenuAnchor(null);
                                actions.mutate(isPlayed ? 'markUnplayed' : 'markPlayed');
                            }}
                        >
                            {globalize.translate(isPlayed ? 'MarkUnplayed' : 'MarkPlayed')}
                        </MenuItem>
                        <MenuItem
                            onClick={() => {
                                setMenuAnchor(null);
                                appRouter.showItem(item, { classic: true });
                            }}
                        >
                            {globalize.translate('ClassicView')}
                        </MenuItem>
                        {/* Only with a plugin that keeps artwork choices */}
                        {overrides && (
                            <MenuItem
                                onClick={() => {
                                    setMenuAnchor(null);
                                    setIsArtworkOpen(true);
                                }}
                            >
                                {globalize.translate('ChangeArtwork')}
                            </MenuItem>
                        )}
                    </Menu>
                    <ArtworkDialog item={item} open={isArtworkOpen} onClose={() => setIsArtworkOpen(false)} />
                </Stack>

                {position > 0 && runtime > 0 && (
                    <Stack direction='row' spacing={1.5} sx={{ alignItems: 'center', mt: 2, maxWidth: 360 }}>
                        <LinearProgress
                            variant='determinate'
                            value={Math.min(100, (position / runtime) * 100)}
                            aria-hidden
                            sx={{ flex: 1, height: 3, backgroundColor: 'rgba(255, 255, 255, 0.3)', '& .MuiLinearProgress-bar': { backgroundColor: 'primary.main' } }}
                        />
                        <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                            {globalize.translate('MinutesRemaining', String(remainingMinutes))}
                        </Typography>
                    </Stack>
                )}
            </Box>
        </Box>
    );
};

export default TitleHero;
