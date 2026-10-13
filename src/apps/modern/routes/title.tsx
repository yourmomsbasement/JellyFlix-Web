import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { PersonKind } from '@jellyfin/sdk/lib/generated-client/models/person-kind';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import React, { type FC, type ReactNode, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import { clearBackdrop } from 'components/backdrop/backdrop';
import Page from 'components/Page';
import globalize from 'lib/globalize';

import MediaCard from '../features/home/components/MediaCard';
import { GUTTER } from '../features/home/components/MediaRow';
import { useSimilar } from '../features/recommendations/api/useRecommendations';
import { usePlayTarget, useSeasons, useTitle } from '../features/title/api/useTitle';
import EpisodeList from '../features/title/components/EpisodeList';
import TitleHero from '../features/title/components/TitleHero';

const MAX_CAST_IN_SUMMARY = 4;

const namesOf = (item: BaseItemDto, ...kinds: PersonKind[]) =>
    (item.People ?? []).filter(p => p.Type && kinds.includes(p.Type)).map(p => p.Name ?? '').filter(Boolean);

/** "Label: value" lines, as in Netflix's side column and About section. */
const Detail: FC<{ label: string, children: ReactNode }> = ({ label, children }) => (
    <Typography sx={{ mb: 1, fontSize: '0.95rem', lineHeight: 1.5, color: '#fff' }}>
        <Box component='span' sx={{ color: '#777' }}>{label}: </Box>
        {children}
    </Typography>
);

const SectionTitle: FC<{ children: ReactNode }> = ({ children }) => (
    <Typography component='h2' sx={{ mb: 2, fontSize: { xs: '1.3rem', md: '1.6rem' }, fontWeight: 700, color: '#fff' }}>
        {children}
    </Typography>
);

/** Netflix-style page for a movie or show. */
const Title: FC = () => {
    const [ searchParams, setSearchParams ] = useSearchParams();
    const itemId = searchParams.get('id') ?? undefined;
    const { data: item, isPending, error } = useTitle(itemId);
    const { data: playTarget } = usePlayTarget(item);
    const { data: seasons } = useSeasons(item);
    const { data: similar } = useSimilar(itemId);

    const isSeries = item?.Type === BaseItemKind.Series;

    // Season: from the URL, else the one Play would continue in, else the first
    const seasonId = searchParams.get('seasonId')
        ?? (playTarget?.Type === BaseItemKind.Episode ? playTarget.SeasonId : undefined)
        ?? seasons?.[0]?.Id
        ?? undefined;

    useEffect(() => {
        clearBackdrop();
    }, []);

    useEffect(() => {
        if (item?.Name) document.title = item.Name;
    }, [ item?.Name ]);

    const people = useMemo(() => item ? {
        cast: namesOf(item, PersonKind.Actor, PersonKind.GuestStar),
        directors: namesOf(item, PersonKind.Director),
        writers: namesOf(item, PersonKind.Writer),
        creators: namesOf(item, PersonKind.Creator)
    } : undefined, [ item ]);

    const onSeasonChange = (id: string) => {
        const next = new URLSearchParams(searchParams);
        next.set('seasonId', id);
        setSearchParams(next, { replace: true });
    };

    return (
        <Page id='titlePage' className='mainAnimatedPage' isBackButtonEnabled>
            {isPending && (
                <Box sx={{ display: 'flex', justifyContent: 'center', pt: '30vh' }}>
                    <CircularProgress />
                </Box>
            )}
            {error && (
                <Typography sx={{ pt: '20vh', textAlign: 'center' }}>{globalize.translate('ErrorDefault')}</Typography>
            )}

            {item && people && (
                <>
                    <TitleHero item={item} playTarget={playTarget} match={similar?.Match} />

                    <Box sx={{ px: GUTTER, pb: 8, position: 'relative', zIndex: 1 }}>
                        {/* Description and the side column */}
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: { xs: 2, md: 6 }, mb: 6 }}>
                            <Typography sx={{ color: '#fff', fontSize: { xs: '1rem', md: '1.15rem' }, lineHeight: 1.6 }}>
                                {item.Overview}
                            </Typography>
                            <Box>
                                {people.cast.length > 0 && (
                                    <Detail label={globalize.translate('Cast')}>
                                        {people.cast.slice(0, MAX_CAST_IN_SUMMARY).join(', ')}
                                        {people.cast.length > MAX_CAST_IN_SUMMARY && (
                                            <Box component='a' href='#about' sx={{ color: '#fff', fontStyle: 'italic', ml: 0.5 }}>
                                                {globalize.translate('CastMore')}
                                            </Box>
                                        )}
                                    </Detail>
                                )}
                                {!!item.Genres?.length && <Detail label={globalize.translate('Genres')}>{item.Genres.join(', ')}</Detail>}
                                {!!item.Tags?.length && (
                                    <Detail label={globalize.translate(isSeries ? 'ThisShowIs' : 'ThisMovieIs')}>{item.Tags.slice(0, 4).join(', ')}</Detail>
                                )}
                            </Box>
                        </Box>

                        {isSeries && seasons && seasons.length > 0 && (
                            <Box sx={{ mb: 6 }}>
                                <EpisodeList
                                    series={item}
                                    seasons={seasons}
                                    seasonId={seasonId}
                                    onSeasonChange={onSeasonChange}
                                    currentEpisodeId={playTarget?.Type === BaseItemKind.Episode ? playTarget.Id : null}
                                />
                            </Box>
                        )}

                        {!!similar?.Items.length && (
                            <Box component='section' sx={{ mb: 6 }}>
                                <SectionTitle>{globalize.translate('HeaderMoreLikeThis')}</SectionTitle>
                                <Box
                                    sx={{
                                        display: 'grid',
                                        gridTemplateColumns: { xs: 'repeat(3, 1fr)', sm: 'repeat(4, 1fr)', md: 'repeat(6, 1fr)', lg: 'repeat(7, 1fr)' },
                                        gap: 1.5
                                    }}
                                >
                                    {similar.Items.map(similarItem => <MediaCard key={similarItem.Id} item={similarItem} />)}
                                </Box>
                            </Box>
                        )}

                        <Box component='section' id='about'>
                            <SectionTitle>{globalize.translate('AboutTitle', item.Name ?? '')}</SectionTitle>
                            {people.creators.length > 0 && <Detail label={globalize.translate('Creators')}>{people.creators.join(', ')}</Detail>}
                            {people.directors.length > 0 && (
                                <Detail label={globalize.translate(people.directors.length > 1 ? 'Directors' : 'Director')}>{people.directors.join(', ')}</Detail>
                            )}
                            {people.cast.length > 0 && <Detail label={globalize.translate('Cast')}>{people.cast.join(', ')}</Detail>}
                            {people.writers.length > 0 && (
                                <Detail label={globalize.translate(people.writers.length > 1 ? 'Writers' : 'Writer')}>{people.writers.join(', ')}</Detail>
                            )}
                            {!!item.Genres?.length && <Detail label={globalize.translate('Genres')}>{item.Genres.join(', ')}</Detail>}
                            {!!item.Studios?.length && (
                                <Detail label={globalize.translate(item.Studios.length > 1 ? 'Studios' : 'Studio')}>{item.Studios.map(s => s.Name).join(', ')}</Detail>
                            )}
                            {item.OfficialRating && (
                                <Detail label={globalize.translate('MaturityRating')}>
                                    <Box component='span' sx={{ px: 0.75, border: '1px solid rgba(255, 255, 255, 0.6)' }}>{item.OfficialRating}</Box>
                                </Detail>
                            )}
                        </Box>
                    </Box>
                </>
            )}
        </Page>
    );
};

export default Title;
