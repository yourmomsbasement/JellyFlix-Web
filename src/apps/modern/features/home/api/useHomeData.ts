import type { Api } from '@jellyfin/sdk';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import { ImageType } from '@jellyfin/sdk/lib/generated-client/models/image-type';
import { ItemFields } from '@jellyfin/sdk/lib/generated-client/models/item-fields';
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by';
import { SortOrder } from '@jellyfin/sdk/lib/generated-client/models/sort-order';
import { getGenreApi } from '@jellyfin/sdk/lib/utils/api/genre-api';
import { MediaType } from '@jellyfin/sdk/lib/generated-client/models/media-type';
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api';
import { getShowApi } from '@jellyfin/sdk/lib/utils/api/show-api';
import { useQuery } from '@tanstack/react-query';

import { useApi } from 'hooks/useApi';

/**
 * Libraries that get their own "Recently Added" row. Movies and shows are covered by the combined rows
 * (New on JellyFlix, genres, ...); music, books and photos don't suit video rows.
 */
export const ROW_COLLECTION_TYPES: (CollectionType | undefined)[] = [
    CollectionType.Homevideos,
    CollectionType.Musicvideos,
    CollectionType.Boxsets,
    undefined // Mixed content libraries have no collection type
];

const ROW_LIMIT = 20;
const MAX_GENRE_ROWS = 8;
/** Genres with fewer titles than this don't get a row; a row of one or two posters looks broken. */
const MIN_GENRE_TITLES = 5;
const TITLE_TYPES = [ BaseItemKind.Movie, BaseItemKind.Series ];

const FIELDS = [
    ItemFields.Overview,
    ItemFields.Genres,
    ItemFields.PrimaryImageAspectRatio,
    ItemFields.ChildCount,
    ItemFields.RemoteTrailers
];

const IMAGE_TYPES = [ ImageType.Primary, ImageType.Backdrop, ImageType.Logo ];

/**
 * Randomly ordered rows are picked once per app session: refetching them would reshuffle the page under the viewer,
 * and persisting them would show the same picks every time the app opens.
 */
const SHUFFLED = { staleTime: Infinity, meta: { persist: false } };

const useHomeQuery = <T>(
    key: string[],
    queryFn: (api: Api, userId: string, signal: AbortSignal) => Promise<T>,
    options?: typeof SHUFFLED
) => {
    const { api, user } = useApi();
    return useQuery({
        queryKey: [ 'JellyFlix', 'Home', ...key, user?.Id ],
        queryFn: ({ signal }) => queryFn(api!, user!.Id!, signal),
        enabled: !!api && !!user?.Id,
        ...options
    });
};

/** A handful of random movies and shows with backdrops for the hero banner. */
export const useHeroItems = () => useHomeQuery([ 'Hero' ], async (api, userId, signal) => {
    const { data } = await getLibraryApi(api).getItems({
        userId,
        includeItemTypes: [ BaseItemKind.Movie, BaseItemKind.Series ],
        recursive: true,
        imageTypes: [ ImageType.Backdrop ],
        sortBy: [ ItemSortBy.Random ],
        limit: 5,
        // Trailer info decides whether the hero offers "Watch Trailer"
        fields: [ ...FIELDS, ItemFields.LocalTrailerCount ],
        enableImageTypes: IMAGE_TYPES,
        imageTypeLimit: 1
    }, { signal });
    return data.Items ?? [];
}, SHUFFLED);

export const useContinueWatching = () => useHomeQuery([ 'Resume' ], async (api, userId, signal) => {
    const { data } = await getLibraryApi(api).getResumeItems({
        userId,
        limit: ROW_LIMIT,
        mediaTypes: [ MediaType.Video ],
        fields: FIELDS,
        enableImageTypes: IMAGE_TYPES,
        imageTypeLimit: 1
    }, { signal });
    return data.Items ?? [];
});

export const useNextUp = () => useHomeQuery([ 'NextUp' ], async (api, userId, signal) => {
    const { data } = await getShowApi(api).getNextUp({
        userId,
        limit: ROW_LIMIT,
        fields: FIELDS,
        enableImageTypes: IMAGE_TYPES,
        imageTypeLimit: 1,
        // Partly watched episodes are already in Continue Watching
        enableResumable: false
    }, { signal });
    return data.Items ?? [];
});

export const useLatestInLibrary = (library: BaseItemDto) => useHomeQuery([ 'Latest', library.Id ?? '' ], async (api, userId, signal) => {
    const { data } = await getLibraryApi(api).getLatestMedia({
        userId,
        parentId: library.Id,
        limit: ROW_LIMIT,
        fields: FIELDS,
        enableImageTypes: IMAGE_TYPES,
        imageTypeLimit: 1
    }, { signal });
    return data;
});

/** Favorites, presented as Netflix's "My List". */
export const useMyList = () => useHomeQuery([ 'MyList' ], async (api, userId, signal) => {
    const { data } = await getLibraryApi(api).getItems({
        userId,
        isFavorite: true,
        recursive: true,
        includeItemTypes: [ BaseItemKind.Movie, BaseItemKind.Series, BaseItemKind.Video, BaseItemKind.MusicVideo, BaseItemKind.BoxSet ],
        sortBy: [ ItemSortBy.SortName ],
        fields: FIELDS,
        enableImageTypes: IMAGE_TYPES,
        imageTypeLimit: 1
    }, { signal });
    return data.Items ?? [];
});

/** Movies and shows of a given kind, as a row. */
const getTitles = async (api: Api, userId: string, signal: AbortSignal, query: Parameters<ReturnType<typeof getLibraryApi>['getItems']>[0]) => {
    const { data } = await getLibraryApi(api).getItems({
        userId,
        includeItemTypes: TITLE_TYPES,
        recursive: true,
        limit: ROW_LIMIT,
        fields: FIELDS,
        enableImageTypes: IMAGE_TYPES,
        imageTypeLimit: 1,
        ...query
    }, { signal });
    return data.Items ?? [];
};

export const useNewlyAdded = () => useHomeQuery([ 'New' ], (api, userId, signal) =>
    getTitles(api, userId, signal, { sortBy: [ ItemSortBy.DateCreated ], sortOrder: [ SortOrder.Descending ] }));

export const useTopRated = () => useHomeQuery([ 'TopRated' ], (api, userId, signal) =>
    getTitles(api, userId, signal, { minCommunityRating: 7, sortBy: [ ItemSortBy.CommunityRating ], sortOrder: [ SortOrder.Descending ] }));

export const useWatchAgain = () => useHomeQuery([ 'WatchAgain' ], (api, userId, signal) =>
    getTitles(api, userId, signal, { isPlayed: true, sortBy: [ ItemSortBy.DatePlayed ], sortOrder: [ SortOrder.Descending ] }));

/** The biggest genres across movies and shows, one row each. */
export const useTopGenres = () => useHomeQuery([ 'Genres' ], async (api, userId, signal) => {
    const { data } = await getGenreApi(api).getGenres({
        userId,
        includeItemTypes: TITLE_TYPES,
        fields: [ ItemFields.ItemCounts ],
        enableImages: false
    }, { signal });
    const count = (genre: BaseItemDto) => (genre.MovieCount ?? 0) + (genre.SeriesCount ?? 0);
    return (data.Items ?? [])
        .filter(genre => count(genre) >= MIN_GENRE_TITLES)
        .sort((a, b) => count(b) - count(a))
        .slice(0, MAX_GENRE_ROWS);
});

export const useGenreTitles = (genre: BaseItemDto) => useHomeQuery([ 'Genre', genre.Id ?? '' ], (api, userId, signal) =>
    getTitles(api, userId, signal, { genreIds: genre.Id ? [ genre.Id ] : undefined, sortBy: [ ItemSortBy.Random ] }), SHUFFLED);
