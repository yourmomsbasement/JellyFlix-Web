import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import type { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import React, { type FC, useEffect, useRef, useState } from 'react';

import {
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
import { useApi } from 'hooks/useApi';
import globalize from 'lib/globalize';

import TvBillboard from '../components/TvBillboard';
import TvPosterTile from '../components/TvPosterTile';
import TvRail from '../components/TvRail';
import TvRow from '../components/TvRow';
import { useTvNavigation } from '../navigation/useTvNavigation';
import { BACKGROUND, CONTENT_LEFT } from '../styles';

/** Where the rows start; the billboard fills the screen above. */
const ROWS_TOP = '25vw';
/** Wait for the remote to settle before swapping the billboard, so scrolling through a row stays smooth. */
const BILLBOARD_DELAY_MS = 250;

interface RowProps {
    title: string
    items: BaseItemDto[] | undefined
    onFocusItem: (item: BaseItemDto) => void
}

/** A row of posters; rows without titles aren't shown at all, so the remote never lands on an empty row. */
const PosterRow: FC<RowProps> = ({ title, items, onFocusItem }) => {
    if (!items?.length) return null;
    return (
        <TvRow title={title}>
            {items.map(item => <TvPosterTile key={item.Id} item={item} onFocusItem={onFocusItem} />)}
        </TvRow>
    );
};

const GenreRow: FC<{ genre: BaseItemDto, onFocusItem: (item: BaseItemDto) => void }> = ({ genre, onFocusItem }) => {
    const { data } = useGenreTitles(genre);
    return <PosterRow title={genre.Name ?? ''} items={data} onFocusItem={onFocusItem} />;
};

const LatestRow: FC<{ library: BaseItemDto, onFocusItem: (item: BaseItemDto) => void }> = ({ library, onFocusItem }) => {
    const { data } = useLatestInLibrary(library);
    return <PosterRow title={globalize.translate('LatestFromLibrary', library.Name ?? '')} items={data} onFocusItem={onFocusItem} />;
};

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
    const myList = useMyList();
    const newlyAdded = useNewlyAdded();
    const topRated = useTopRated();
    const watchAgain = useWatchAgain();
    const { data: genres } = useTopGenres();
    const { data: views } = useUserViews();
    const { data: appearance } = useAppearance();
    const seasonAccent = getSeasonAccent(appearance?.Season);
    const libraries = views?.Items?.filter(view => ROW_COLLECTION_TYPES.includes(view.CollectionType as CollectionType | undefined)) ?? [];

    const recs = recommendations.data;
    const topPicks = recs?.Recommended.map(r => r.Item);
    const seedRows = recs?.BecauseYouWatched ?? [];

    // The billboard follows the focused tile, after a moment
    const [ focused, setFocused ] = useState<BaseItemDto>();
    const [ billboard, setBillboard ] = useState<BaseItemDto>();
    useEffect(() => {
        const timeout = window.setTimeout(() => setBillboard(focused), BILLBOARD_DELAY_MS);
        return () => window.clearTimeout(timeout);
    }, [ focused ]);

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

                <TvBillboard item={billboard ?? focused ?? hero.data?.[0]} />
                <SeasonalDecor season={appearance?.Season} height='40vw' />

                {isLoading && <CircularProgress sx={{ position: 'absolute', top: '50%', left: '50%' }} />}

                {/* Starts a little left of the content so the focus ring around the first tile isn't cut off */}
                <Box sx={{ position: 'absolute', top: ROWS_TOP, bottom: 0, left: `calc(${CONTENT_LEFT} - 1vw)`, right: 0, overflow: 'hidden', zIndex: 1 }}>
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
                </Box>
            </Box>
        </Page>
    );
};

export default TvHome;
