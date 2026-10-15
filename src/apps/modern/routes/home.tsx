import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import type { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import React, { type FC, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

import { useAppearance } from 'apps/modern/features/appearance/api/useAppearance';
import AccentScope from 'apps/modern/features/appearance/components/AccentScope';
import SeasonalDecor from 'apps/modern/features/appearance/components/SeasonalDecor';
import SeasonalRows from 'apps/modern/features/appearance/components/SeasonalRows';
import { getSeasonAccent } from 'apps/modern/features/appearance/seasons';
import { useHousehold } from 'apps/profiles/api/profiles';
import { clearBackdrop } from 'components/backdrop/backdrop';
import Page from 'components/Page';
import { useUserViews } from 'hooks/api/useUserViews';
import { useApi } from 'hooks/useApi';
import { useNearViewport } from 'hooks/useNearViewport';
import globalize from 'lib/globalize';

import {
    HOME_ROW_LIMIT,
    ROW_COLLECTION_TYPES,
    useContinueWatching,
    useGenreTitles,
    useHeroItems,
    useLatestInLibrary,
    useMyList,
    useNewlyAdded,
    useNextUp,
    useTopGenres,
    useTopRated,
    useWatchAgain
} from '../features/home/api/useHomeData';
import HeroBanner from '../features/home/components/HeroBanner';
import MediaCard from '../features/home/components/MediaCard';
import MediaRow, { GUTTER } from '../features/home/components/MediaRow';
import { useRecommendations } from '../features/recommendations/api/useRecommendations';

/** Space for the app bar on pages without a hero underneath it. */
const APP_BAR_OFFSET = '72px';

// Genre and library rows sit far down the page; they load their titles once the viewer scrolls near them

const LatestRow: FC<{ library: BaseItemDto }> = ({ library }) => {
    const [ rowRef, isNear ] = useNearViewport();
    const { data, isPending } = useLatestInLibrary(library, isNear);
    return (
        <div ref={rowRef}>
            <MediaRow title={globalize.translate('LatestFromLibrary', library.Name ?? '')} items={data} isPending={!isNear || isPending} />
        </div>
    );
};

const GenreRow: FC<{ genre: BaseItemDto }> = ({ genre }) => {
    const [ rowRef, isNear ] = useNearViewport();
    const { data, isPending } = useGenreTitles(genre, isNear);
    return (
        <div ref={rowRef}>
            <MediaRow title={genre.Name ?? ''} items={data} isPending={!isNear || isPending} />
        </div>
    );
};

const Browse: FC = () => {
    const { user } = useApi();
    const { data: household } = useHousehold();
    const profileName = household?.Profiles.find(p => p.Id === household.CurrentProfileId)?.Name ?? user?.Name;

    const hero = useHeroItems();
    const recommendations = useRecommendations();
    const resume = useContinueWatching();
    const nextUp = useNextUp();
    const myList = useMyList(HOME_ROW_LIMIT);
    const newlyAdded = useNewlyAdded();
    const topRated = useTopRated();
    const watchAgain = useWatchAgain();
    const { data: genres } = useTopGenres();
    const { data: views, isPending: isViewsPending } = useUserViews();
    const { data: appearance } = useAppearance();
    const season = appearance?.Season;

    const libraries = views?.Items?.filter(view => ROW_COLLECTION_TYPES.includes(view.CollectionType as CollectionType | undefined)) ?? [];
    // With history, feature the profile's top picks (Netflix's hero is personalized); otherwise random titles.
    // Wait for recommendations before choosing so the hero doesn't swap titles a moment after loading.
    const recs = recommendations.data;
    const topPicks = recs?.Recommended.map(r => r.Item) ?? [];
    const personalizedHero = recs?.IsPersonalized ? topPicks.filter(item => !!item.BackdropImageTags?.length).slice(0, 5) : [];
    const heroItems = personalizedHero.length ? personalizedHero : hero.data ?? [];
    const isHeroPending = recommendations.isPending || hero.isPending;
    const hasHero = !isHeroPending && heroItems.length > 0;
    const seedRows = recs?.BecauseYouWatched ?? [];
    const seedRow = (index: number) => {
        const row = seedRows[index];
        return row && <MediaRow key={row.SeedId} title={globalize.translate('BecauseYouWatched', row.SeedName)} items={row.Items} />;
    };

    if (!isViewsPending && !hero.isPending && !newlyAdded.isPending && !newlyAdded.data?.length && !libraries.length && !hasHero) {
        return (
            <Box sx={{ pt: APP_BAR_OFFSET, px: GUTTER, textAlign: 'center' }}>
                <Typography variant='h2' sx={{ mt: 6 }}>{globalize.translate('MessageNothingHere')}</Typography>
            </Box>
        );
    }

    return (
        // In season, the home page takes the season's accent and artwork
        <AccentScope accent={getSeasonAccent(season)}>
            <SeasonalDecor season={season} />
            {hasHero && <HeroBanner items={heroItems} />}
            {!hasHero && <Box sx={{ height: isHeroPending ? { xs: '72vh', md: '74vh' } : APP_BAR_OFFSET }} />}

            {/* The first rows slide up over the bottom of the hero, like Netflix */}
            <Box sx={{ position: 'relative', zIndex: 1, mt: hasHero ? { xs: '-6vh', md: '-16vh' } : 0, pb: 6 }}>
                <MediaRow
                    title={profileName ? globalize.translate('ContinueWatchingFor', profileName) : globalize.translate('HeaderContinueWatching')}
                    items={resume.data}
                    isPending={resume.isPending}
                    primaryAction='play'
                    watchActions={[ 'markWatched', 'markShowWatched', 'removeFromContinueWatching' ]}
                />
                <MediaRow
                    title={globalize.translate('NextUp')}
                    items={nextUp.data}
                    isPending={nextUp.isPending}
                    watchActions={[ 'markWatched', 'markShowWatched' ]}
                />
                <MediaRow
                    title={recs?.IsPersonalized && profileName ? globalize.translate('TopPicksFor', profileName) : globalize.translate('TopPicks')}
                    items={topPicks}
                    isPending={recommendations.isPending}
                />
                <SeasonalRows shelves={appearance?.Shelves} renderRow={(title, shelf) => <MediaRow title={title} items={shelf.Items} />} />
                <MediaRow title={globalize.translate('NewOnJellyFlix')} items={newlyAdded.data} isPending={newlyAdded.isPending} />
                <MediaRow title={globalize.translate('MyList')} items={myList.data} isPending={myList.isPending} />
                <MediaRow title={globalize.translate('TopRated')} items={topRated.data} isPending={topRated.isPending} />
                {seedRow(0)}
                {genres?.slice(0, 2).map(genre => <GenreRow key={genre.Id} genre={genre} />)}
                {seedRow(1)}
                {genres?.slice(2, 4).map(genre => <GenreRow key={genre.Id} genre={genre} />)}
                <MediaRow title={globalize.translate('WatchItAgain')} items={watchAgain.data} isPending={watchAgain.isPending} />
                {genres?.slice(4).map(genre => <GenreRow key={genre.Id} genre={genre} />)}
                {libraries.map(library => <LatestRow key={library.Id} library={library} />)}
            </Box>
        </AccentScope>
    );
};

const MyList: FC = () => {
    const { data: items, isPending } = useMyList();

    return (
        <Box sx={{ pt: APP_BAR_OFFSET, px: GUTTER, pb: 6 }}>
            <Typography component='h1' sx={{ mt: 3, mb: 3, fontSize: { xs: '1.5rem', md: '2.2rem' }, fontWeight: 700, color: 'text.primary' }}>
                {globalize.translate('MyList')}
            </Typography>

            {isPending && <CircularProgress />}
            {!isPending && !items?.length && (
                <Typography sx={{ color: 'text.secondary' }}>{globalize.translate('MyListEmpty')}</Typography>
            )}

            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: 'repeat(3, 1fr)', sm: 'repeat(4, 1fr)', md: 'repeat(6, 1fr)', lg: 'repeat(7, 1fr)', xl: 'repeat(8, 1fr)' },
                    columnGap: 1,
                    rowGap: 3
                }}
            >
                {items?.map(item => <MediaCard key={item.Id} item={item} />)}
            </Box>
        </Box>
    );
};

const Home: FC = () => {
    const [ searchParams ] = useSearchParams();
    const isMyList = searchParams.get('tab') === '1';

    useEffect(() => {
        clearBackdrop();
        import('../../../scripts/libraryMenu')
            .then(({ default: libraryMenu }) => libraryMenu.setTitle(null))
            .catch(err => console.error('[Home] failed to set title', err));
    }, []);

    return (
        <Page
            id='indexPage'
            className='mainAnimatedPage homePage'
            isBackButtonEnabled={false}
        >
            {isMyList ? <MyList /> : <Browse />}
        </Page>
    );
};

export default Home;
