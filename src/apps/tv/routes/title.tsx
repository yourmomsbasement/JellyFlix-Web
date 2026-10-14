import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { PersonKind } from '@jellyfin/sdk/lib/generated-client/models/person-kind';
import Add from '@mui/icons-material/Add';
import ArrowBack from '@mui/icons-material/ArrowBack';
import Check from '@mui/icons-material/Check';
import PlayArrow from '@mui/icons-material/PlayArrow';
import RemoveDone from '@mui/icons-material/RemoveDone';
import ThumbUpAlt from '@mui/icons-material/ThumbUpAlt';
import ThumbUpOffAlt from '@mui/icons-material/ThumbUpOffAlt';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Movie from '@mui/icons-material/Movie';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import React, { type FC, type ReactNode, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { useWatchActions } from 'apps/modern/features/home/api/useWatchActions';
import { getStillUrl } from 'apps/modern/features/home/utils/images';
import { getPlayedPercentage, hasTrailer, playItem, playTrailer } from 'apps/modern/features/home/utils/items';
import { useSimilar } from 'apps/modern/features/recommendations/api/useRecommendations';
import { useEpisodes, usePlayTarget, useSeasons, useTitle, useTitleActions } from 'apps/modern/features/title/api/useTitle';
import { getPlayLabel } from 'apps/modern/features/title/components/TitleHero';
import { getMediaInfo, getQualityBadges } from 'apps/modern/features/title/utils/mediaInfo';
import { appRouter } from 'components/router/appRouter';
import { clearBackdrop } from 'components/backdrop/backdrop';
import Page from 'components/Page';
import { useApi } from 'hooks/useApi';
import globalize from 'lib/globalize';

import TvBillboard from '../components/TvBillboard';
import TvPosterTile, { onPlayKey } from '../components/TvPosterTile';
import TvRow from '../components/TvRow';
import { useTvNavigation } from '../navigation/useTvNavigation';
import { BACKGROUND, CONTENT_LEFT, focusRingSx, tvPillSx } from '../styles';

const TICKS_PER_MINUTE = 600_000_000;
const MAX_CAST = 3;

/** Back, or Home when the page was opened directly. */
export const goBack = () => {
    void (appRouter.canGoBack() ? appRouter.back() : appRouter.goHome());
};

/** The buttons stay put; rows further down slide up to just below the top of the screen. */
export const stageOffset = (row: HTMLElement, top: number) => (row.dataset.tvStatic === undefined ? top - window.innerWidth * 0.03 : 0);

interface PillProps {
    icon: ReactNode
    label: string
    isDefault?: boolean
    onSelect: () => void
}

export const Pill: FC<PillProps> = ({ icon, label, isDefault, onSelect }) => (
    <Box component='button' type='button' data-tv-item data-tv-default={isDefault || undefined} onClick={onSelect} sx={tvPillSx}>
        {icon}
        {label}
    </Box>
);

const EpisodeTile: FC<{ episode: BaseItemDto, isNext: boolean }> = ({ episode, isNext }) => {
    const { api } = useApi();
    const stillUrl = getStillUrl(api, episode, 640);
    const progress = getPlayedPercentage(episode);
    const minutes = episode.RunTimeTicks ? Math.round(episode.RunTimeTicks / TICKS_PER_MINUTE) : undefined;

    return (
        <Box
            component='button'
            type='button'
            data-tv-item
            data-tv-start={isNext || undefined}
            onClick={() => playItem(episode)}
            onKeyDown={onPlayKey(episode)}
            sx={{
                flex: '0 0 auto',
                width: '24vw',
                p: 0,
                border: 0,
                background: 'none',
                color: '#fff',
                fontFamily: 'inherit',
                textAlign: 'left',
                cursor: 'pointer',
                outline: 'none',
                '&:focus .tvEpisode-still': { outlineColor: '#fff', transform: 'scale(1.04)' }
            }}
        >
            <Box
                className='tvEpisode-still'
                sx={{
                    ...focusRingSx,
                    position: 'relative',
                    height: '13.5vw', // 16:9
                    mb: '0.7vw',
                    borderRadius: '0.35vw',
                    overflow: 'hidden',
                    backgroundColor: '#2a2a2a',
                    backgroundImage: stillUrl ? `url("${stillUrl}")` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}
            >
                {progress > 0 && (
                    <Box sx={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '0.35vw', backgroundColor: 'rgba(255, 255, 255, 0.3)' }}>
                        <Box sx={{ width: `${progress}%`, height: '100%', backgroundColor: 'primary.main' }} />
                    </Box>
                )}
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: '1vw', fontSize: '1.2vw', fontWeight: 600 }}>
                <Box component='span' sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {episode.IndexNumber != null ? `${episode.IndexNumber}. ` : ''}{episode.Name}
                </Box>
                {minutes && <Box component='span' sx={{ color: '#bcbcbc', fontWeight: 400 }}>{minutes}m</Box>}
            </Box>
            {episode.Overview && (
                <Box
                    sx={{
                        mt: '0.4vw',
                        color: '#bcbcbc',
                        fontSize: '0.95vw',
                        lineHeight: 1.4,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                    }}
                >
                    {episode.Overview}
                </Box>
            )}
        </Box>
    );
};

/** Netflix's TV title screen: Play first, then the episodes and More Like This further down. */
const TvTitle: FC<{ itemId: string | undefined }> = ({ itemId }) => {
    const rootRef = useRef<HTMLDivElement>(null);
    const [ searchParams ] = useSearchParams();
    const { data: item, isPending } = useTitle(itemId);
    const { data: playTarget } = usePlayTarget(item);
    const { data: seasons } = useSeasons(item);
    const { data: similar } = useSimilar(itemId);
    const actions = useTitleActions(item);
    const watchActions = useWatchActions();

    const isSeries = item?.Type === BaseItemKind.Series;
    const defaultSeasonId = searchParams.get('seasonId')
        ?? (playTarget?.Type === BaseItemKind.Episode ? playTarget.SeasonId : undefined)
        ?? seasons?.[0]?.Id
        ?? undefined;
    const [ chosenSeasonId, setChosenSeasonId ] = useState<string>();
    const seasonId = chosenSeasonId ?? defaultSeasonId;
    const { data: episodes } = useEpisodes(isSeries ? item.Id ?? undefined : undefined, seasonId);

    useTvNavigation(rootRef, { memoryKey: itemId && `title:${itemId}`, stageOffset });

    useEffect(() => {
        clearBackdrop();
    }, []);

    useEffect(() => {
        if (item?.Name) document.title = item.Name;
    }, [ item?.Name ]);

    const isInProgress = (playTarget?.UserData?.PlaybackPositionTicks ?? 0) > 0;
    const isFavorite = !!item?.UserData?.IsFavorite;
    const isLiked = item?.UserData?.Likes === true;
    const isPlayed = !!item?.UserData?.Played;
    // A show has no file of its own: describe the episode Play would start
    const { data: playTargetDetails } = useTitle(isSeries ? playTarget?.Id ?? undefined : undefined);
    const mediaItem = isSeries ? playTargetDetails : item;
    const media = getMediaInfo(mediaItem)[0];
    const mediaLine = [
        ...getQualityBadges(mediaItem),
        media?.container,
        media?.videoCodec,
        media?.audio[0]
    ].filter(Boolean).join('  ·  ');

    const cast = (item?.People ?? []).filter(p => p.Type === PersonKind.Actor).slice(0, MAX_CAST).map(p => p.Name);

    return (
        <Page id='tvTitlePage' className='mainAnimatedPage' isBackButtonEnabled>
            <Box ref={rootRef} sx={{ position: 'fixed', inset: 0, zIndex: 10, overflow: 'hidden', backgroundColor: BACKGROUND, color: '#fff' }}>
                {/* For the Magic Remote pointer; the remote's Back key does the same */}
                <Box
                    component='button'
                    type='button'
                    aria-label={globalize.translate('ButtonBack')}
                    onClick={goBack}
                    sx={{
                        position: 'absolute',
                        top: '1.5vw',
                        left: '1.5vw',
                        zIndex: 2,
                        display: 'flex',
                        p: '0.6vw',
                        border: 0,
                        borderRadius: '50%',
                        backgroundColor: 'rgba(0, 0, 0, 0.4)',
                        color: '#fff',
                        cursor: 'pointer',
                        '& svg': { fontSize: '2vw' },
                        '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.2)' }
                    }}
                >
                    <ArrowBack />
                </Box>

                {isPending && <CircularProgress sx={{ position: 'absolute', top: '50%', left: '50%' }} />}

                {item && (
                    <Box data-tv-stage sx={{ position: 'relative', transition: 'transform 0.35s ease-out' }}>
                        <TvBillboard item={item} height='46vw' match={similar?.Match} overviewLines={4}>
                            {cast.length > 0 && (
                                <Box sx={{ mt: '0.5vw', color: '#bcbcbc', fontSize: '1.05vw' }}>
                                    {globalize.translate('Cast')}: {cast.join(', ')}
                                </Box>
                            )}
                            {mediaLine && (
                                <Box sx={{ mt: '0.5vw', color: '#bcbcbc', fontSize: '1.05vw', whiteSpace: 'pre' }}>{mediaLine}</Box>
                            )}

                            <Box data-tv-row data-tv-static sx={{ display: 'flex', flexWrap: 'wrap', gap: '1vw', mt: '2vw' }}>
                                <Pill
                                    icon={<PlayArrow />}
                                    label={getPlayLabel(playTarget)}
                                    isDefault
                                    onSelect={() => playTarget && playItem(playTarget)}
                                />
                                {hasTrailer(item) && (
                                    <Pill icon={<Movie />} label={globalize.translate('Trailer')} onSelect={() => playTrailer(item)} />
                                )}
                                <Pill
                                    icon={isFavorite ? <Check /> : <Add />}
                                    label={globalize.translate('MyList')}
                                    onSelect={() => actions.mutate('toggleFavorite')}
                                />
                                <Pill
                                    icon={isLiked ? <ThumbUpAlt /> : <ThumbUpOffAlt />}
                                    label={globalize.translate('ILikeThis')}
                                    onSelect={() => actions.mutate(isLiked ? 'clearRating' : 'like')}
                                />
                                {isInProgress && playTarget && (
                                    <Pill
                                        icon={<RemoveDone />}
                                        label={globalize.translate('RemoveFromContinueWatching')}
                                        onSelect={() => watchActions.mutate({ action: 'removeFromContinueWatching', item: playTarget })}
                                    />
                                )}
                                <Pill
                                    icon={isPlayed ? <VisibilityOff /> : <Visibility />}
                                    label={globalize.translate(isPlayed ? 'MarkAsUnwatched' : 'MarkAsWatched')}
                                    onSelect={() => actions.mutate(isPlayed ? 'markUnplayed' : 'markPlayed')}
                                />
                            </Box>
                        </TvBillboard>

                        <Box sx={{ position: 'relative', zIndex: 1, ml: CONTENT_LEFT, mr: '3vw', mt: '4vw', pb: '30vw' }}>
                            {isSeries && seasons && seasons.length > 1 && (
                                <TvRow title={globalize.translate('HeaderSeasons')}>
                                    {seasons.map(season => (
                                        <Box
                                            key={season.Id}
                                            component='button'
                                            type='button'
                                            data-tv-item
                                            // Like Netflix, moving onto a season shows its episodes
                                            onFocus={() => setChosenSeasonId(season.Id ?? undefined)}
                                            sx={{
                                                ...tvPillSx,
                                                height: '2.8vw',
                                                fontSize: '1.1vw',
                                                ...(season.Id === seasonId && { backgroundColor: 'rgba(255, 255, 255, 0.25)' })
                                            }}
                                        >
                                            {season.Name}
                                        </Box>
                                    ))}
                                </TvRow>
                            )}

                            {isSeries && !!episodes?.length && (
                                <TvRow title={globalize.translate('Episodes')}>
                                    {episodes.map(episode => <EpisodeTile key={episode.Id} episode={episode} isNext={episode.Id === playTarget?.Id} />)}
                                </TvRow>
                            )}

                            {!!similar?.Items.length && (
                                <TvRow title={globalize.translate('HeaderMoreLikeThis')}>
                                    {similar.Items.map(similarItem => <TvPosterTile key={similarItem.Id} item={similarItem} />)}
                                </TvRow>
                            )}
                        </Box>
                    </Box>
                )}
            </Box>
        </Page>
    );
};

/** More Like This opens another title on the same route; start that one afresh. */
const TvTitlePage: FC = () => {
    const [ searchParams ] = useSearchParams();
    const itemId = searchParams.get('id') ?? undefined;
    return <TvTitle key={itemId} itemId={itemId} />;
};

export default TvTitlePage;
