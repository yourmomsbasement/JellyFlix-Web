import type { Api } from '@jellyfin/sdk';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import { ImageType } from '@jellyfin/sdk/lib/generated-client/models/image-type';
import { ItemFields } from '@jellyfin/sdk/lib/generated-client/models/item-fields';
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by';
import { MediaType } from '@jellyfin/sdk/lib/generated-client/models/media-type';
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api';
import { getShowApi } from '@jellyfin/sdk/lib/utils/api/show-api';
import { useQuery } from '@tanstack/react-query';

import { useApi } from 'hooks/useApi';

/** Libraries whose content gets a "Recently Added" row. Music, books and photos don't suit landscape video rows. */
export const ROW_COLLECTION_TYPES: (CollectionType | undefined)[] = [
    CollectionType.Movies,
    CollectionType.Tvshows,
    CollectionType.Homevideos,
    CollectionType.Musicvideos,
    CollectionType.Boxsets,
    undefined // Mixed content libraries have no collection type
];

const ROW_LIMIT = 20;

const FIELDS = [
    ItemFields.Overview,
    ItemFields.Genres,
    ItemFields.PrimaryImageAspectRatio,
    ItemFields.ChildCount
];

const IMAGE_TYPES = [ ImageType.Primary, ImageType.Backdrop, ImageType.Thumb, ImageType.Logo ];

const useHomeQuery = <T>(key: string[], queryFn: (api: Api, userId: string, signal: AbortSignal) => Promise<T>) => {
    const { api, user } = useApi();
    return useQuery({
        queryKey: [ 'JellyFlix', 'Home', ...key, user?.Id ],
        queryFn: ({ signal }) => queryFn(api!, user!.Id!, signal),
        enabled: !!api && !!user?.Id
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
        fields: FIELDS,
        enableImageTypes: IMAGE_TYPES,
        imageTypeLimit: 1
    }, { signal });
    return data.Items ?? [];
});

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
