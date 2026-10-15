import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import type { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import React, { createContext, type FC, memo, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';

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
} from 'apps/modern/features/home/api/useHomeData';
import { useAppearance } from 'apps/modern/features/appearance/api/useAppearance';
import { accentVars } from 'apps/modern/features/appearance/components/AccentScope';
import SeasonalDecor from 'apps/modern/features/appearance/components/SeasonalDecor';
import SeasonalRows from 'apps/modern/features/appearance/components/SeasonalRows';
import { getSeasonAccent } from 'apps/modern/features/appearance/seasons';
import { useRecommendations } from 'apps/modern/features/recommendations/api/useRecommendations';
import { useHousehold } from 'apps/profiles/api/profiles';
import { clearBackdrop } from 'components/backdrop/backdrop';
import Page from 'components/Page';
import { useUserViews } from 'hooks/api/useUserViews';
import { useNearViewport } from 'hooks/useNearViewport';
import { useApi } from 'hooks/useApi';
import globalize from 'lib/globalize';

import TvBillboard from '../components/TvBillboard';
import TvPosterTile from '../components/TvPosterTile';
import TvRail from '../components/TvRail';
import TvRow from '../components/TvRow';
import { useTvNavigation } from '../navigation/useTvNavigation';
import { BACKGROUND, CONTENT_LEFT, POSTER_HEIGHT } from '../styles';

/** Where the rows start; the billboard fills the screen above. */
const ROWS_TOP = '25vw';
/** Wait for the remote to settle before swapping the billboard, so scrolling through a row stays smooth. */
const BILLBOARD_DELAY_MS = 250;

/** Rows within a screen below the visible ones count as near: they load their posters (and titles) ahead of the remote. */
const NEAR_ROWS_MARGIN = '0px 0px 100% 0px';
/** Space held for a row that hasn't loaded yet, so the page doesn't jump when it does. */
const ROW_PLACEHOLDER_HEIGHT = `calc(${POSTER_HEIGHT} + 4vw)`;

/** The clipping box the rows slide through; rows watch how close they are to it. */
const RowsRootContext = createContext<Element | null>(null);

const useNearRows = () => useNearViewport({ root: useContext(RowsRootContext), rootMargin: NEAR_ROWS_MARGIN });

/**
 * The focused tile, kept outside React state: moving through the rows then only re-renders the billboard, not every
 * row and poster on the page.
 */
const createFocusStore = () => {
    let focused: BaseItemDto | undefined;
    const listeners = new Set<() => void>();
    return {
        set: (item: BaseItemDto) => {
            if (item === focused) return;
            focused = item;
            for (const listener of listeners) listener();
        },
        get: () => focused,
        subscribe: (listener: () => void) => {
            listeners.add(listener);
            return () => {
                listeners.delete(listener);
            };
        }
    };
};

type FocusStore = ReturnType<typeof createFocusStore>;

/** The billboard follows the focused tile, after a moment. */
const FollowingBillboard: FC<{ store: FocusStore, fallback: BaseItemDto | undefined }> = ({ store, fallback }) => {
    const focused = useSyncExternalStore(store.subscribe, store.get);
    const [ billboard, setBillboard ] = useState<BaseItemDto>();
    useEffect(() => {
        const timeout = window.setTimeout(() => setBillboard(focused), BILLBOARD_DELAY_MS);
        return () => window.clearTimeout(timeout);
    }, [ focused ]);
    return <TvBillboard item={billboard ?? focused ?? fallback} />;
};

interface RowProps {
    title: string
    items: BaseItemDto[] | undefined
    onFocusItem: (item: BaseItemDto) => void
}

/** A row of posters; rows without titles aren't shown at all, so the remote never lands on an empty row. */
const PosterRowContent: FC<RowProps> = ({ title, items, onFocusItem }) => {
    const [ rowRef, isNear ] = useNearRows();
    if (!items?.length) return null;
    return (
        <div ref={rowRef}>
            <TvRow title={title}>
                {items.map(item => <TvPosterTile key={item.Id} item={item} onFocusItem={onFocusItem} showImage={isNear} />)}
            </TvRow>
        </div>
    );
};

const PosterRow = memo(PosterRowContent);

/** Space for a row that only loads its titles once it's near the screen. */
const DeferredRowPlaceholder: FC<{ rowRef: (element: Element | null) => void }> = ({ rowRef }) => (
    <div ref={rowRef} style={{ height: ROW_PLACEHOLDER_HEIGHT }} />
);

const GenreRowContent: FC<{ genre: BaseItemDto, onFocusItem: (item: BaseItemDto) => void }> = ({ genre, onFocusItem }) => {
    const [ rowRef, isNear ] = useNearRows();
    const { data } = useGenreTitles(genre, isNear);
    if (!isNear || !data) return <DeferredRowPlaceholder rowRef={rowRef} />;
    return <PosterRow title={genre.Name ?? ''} items={data} onFocusItem={onFocusItem} />;
};

const GenreRow = memo(GenreRowContent);

const LatestRowContent: FC<{ library: BaseItemDto, onFocusItem: (item: BaseItemDto) => void }> = ({ library, onFocusItem }) => {
    const [ rowRef, isNear ] = useNearRows();
    const { data } = useLatestInLibrary(library, isNear);
    if (!isNear || !data) return <DeferredRowPlaceholder rowRef={rowRef} />;
    return <PosterRow title={globalize.translate('LatestFromLibrary', library.Name ?? '')} items={data} onFocusItem={onFocusItem} />;
};

const LatestRow = memo(LatestRowContent);

/** Netflix's TV home: the focused title fills the top of the screen, rows of posters slide underneath. */
const TvHome: FC = () => {
    const rootRef = useRef<HTMLDivElement>(null);
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
    const { data: views } = useUserViews();
    const { data: appearance } = useAppearance();
    const seasonAccent = getSeasonAccent(appearance?.Season);
    const libraries = views?.Items?.filter(view => ROW_COLLECTION_TYPES.includes(view.CollectionType as CollectionType | undefined)) ?? [];

    const recs = recommendations.data;
    const topPicks = useMemo(() => recs?.Recommended.map(r => r.Item), [ recs ]);
    const seedRows = recs?.BecauseYouWatched ?? [];

    const [ focusStore ] = useState(createFocusStore);
    const setFocused = focusStore.set;
    const [ rowsRoot, setRowsRoot ] = useState<HTMLDivElement | null>(null);

    useTvNavigation(rootRef, { memoryKey: 'home', backToFirstRow: true });

    useEffect(() => {
        clearBackdrop();
    }, []);

    const seedRow = (index: number) => {
        const row = seedRows[index];
        return row && <PosterRow key={row.SeedId} title={globalize.translate('BecauseYouWatched', row.SeedName)} items={row.Items} onFocusItem={setFocused} />;
    };

    const isLoading = resume.isPending && hero.isPending && newlyAdded.isPending;

    return (
        <Page id='tvHomePage' className='mainAnimatedPage' isBackButtonEnabled={false}>
            <Box ref={rootRef} sx={{ position: 'fixed', inset: 0, zIndex: 10, overflow: 'hidden', backgroundColor: BACKGROUND, color: '#fff', ...(seasonAccent && accentVars(seasonAccent)) }}>
                <TvRail current='home' />

                <FollowingBillboard store={focusStore} fallback={hero.data?.[0]} />
                <SeasonalDecor season={appearance?.Season} height='40vw' />

                {isLoading && <CircularProgress sx={{ position: 'absolute', top: '50%', left: '50%' }} />}

                {/* Starts a little left of the content so the focus ring around the first tile isn't cut off */}
                <Box ref={setRowsRoot} sx={{ position: 'absolute', top: ROWS_TOP, bottom: 0, left: `calc(${CONTENT_LEFT} - 1vw)`, right: 0, overflow: 'hidden', zIndex: 1 }}>
                    <RowsRootContext.Provider value={rowsRoot}>
                        <Box data-tv-stage sx={{ position: 'relative', pl: '1vw', transition: 'transform 0.3s ease-out' }}>
                            <PosterRow
                                title={profileName ? globalize.translate('ContinueWatchingFor', profileName) : globalize.translate('HeaderContinueWatching')}
                                items={resume.data}
                                onFocusItem={setFocused}
                            />
                            <PosterRow title={globalize.translate('NextUp')} items={nextUp.data} onFocusItem={setFocused} />
                            <PosterRow
                                title={recs?.IsPersonalized && profileName ? globalize.translate('TopPicksFor', profileName) : globalize.translate('TopPicks')}
                                items={topPicks}
                                onFocusItem={setFocused}
                            />
                            <SeasonalRows shelves={appearance?.Shelves} renderRow={(title, shelf) => <PosterRow title={title} items={shelf.Items} onFocusItem={setFocused} />} />
                            <PosterRow title={globalize.translate('NewOnJellyFlix')} items={newlyAdded.data} onFocusItem={setFocused} />
                            <PosterRow title={globalize.translate('MyList')} items={myList.data} onFocusItem={setFocused} />
                            <PosterRow title={globalize.translate('TopRated')} items={topRated.data} onFocusItem={setFocused} />
                            {seedRow(0)}
                            {genres?.slice(0, 2).map(genre => <GenreRow key={genre.Id} genre={genre} onFocusItem={setFocused} />)}
                            {seedRow(1)}
                            {genres?.slice(2, 4).map(genre => <GenreRow key={genre.Id} genre={genre} onFocusItem={setFocused} />)}
                            <PosterRow title={globalize.translate('WatchItAgain')} items={watchAgain.data} onFocusItem={setFocused} />
                            {genres?.slice(4).map(genre => <GenreRow key={genre.Id} genre={genre} onFocusItem={setFocused} />)}
                            {libraries.map(library => <LatestRow key={library.Id} library={library} onFocusItem={setFocused} />)}
                            {/* Room for the last row to slide up to the top */}
                            <Box sx={{ height: '30vw' }} />
                        </Box>
                    </RowsRootContext.Provider>
                </Box>
            </Box>
        </Page>
    );
};

export default TvHome;
