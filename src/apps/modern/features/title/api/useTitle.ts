import type { Api } from '@jellyfin/sdk';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { ItemFields } from '@jellyfin/sdk/lib/generated-client/models/item-fields';
import { MediaType } from '@jellyfin/sdk/lib/generated-client/models/media-type';
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api';
import { getShowApi } from '@jellyfin/sdk/lib/utils/api/show-api';
import { getUserDataApi } from '@jellyfin/sdk/lib/utils/api/user-data-api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useApi } from 'hooks/useApi';

const KEY = [ 'JellyFlix', 'Title' ];

const useTitleQuery = <T>(key: (string | undefined)[], queryFn: (api: Api, userId: string, signal: AbortSignal) => Promise<T>, enabled = true) => {
    const { api, user } = useApi();
    return useQuery({
        queryKey: [ ...KEY, ...key, user?.Id ],
        queryFn: ({ signal }) => queryFn(api!, user!.Id!, signal),
        enabled: enabled && !!api && !!user?.Id
    });
};

export const useTitle = (itemId: string | undefined) => useTitleQuery([ 'Item', itemId ], async (api, userId, signal) => {
    const { data } = await getLibraryApi(api).getItem({ itemId: itemId!, userId }, { signal });
    return data;
}, !!itemId);

export const useSeasons = (series: BaseItemDto | undefined) => useTitleQuery([ 'Seasons', series?.Id ], async (api, userId, signal) => {
    const { data } = await getShowApi(api).getSeasons({ seriesId: series!.Id!, userId }, { signal });
    return data.Items ?? [];
}, series?.Type === BaseItemKind.Series);

export const useEpisodes = (seriesId: string | undefined, seasonId: string | undefined) => useTitleQuery([ 'Episodes', seriesId, seasonId ], async (api, userId, signal) => {
    const { data } = await getShowApi(api).getEpisodes({
        seriesId: seriesId!,
        seasonId,
        userId,
        fields: [ ItemFields.Overview ]
    }, { signal });
    return data.Items ?? [];
}, !!seriesId && !!seasonId);

/**
 * What the big Play button starts. For a show: the episode in progress, else the next one, else the first episode.
 * For a movie: the movie (resuming if started).
 */
export const usePlayTarget = (item: BaseItemDto | undefined) => useTitleQuery([ 'PlayTarget', item?.Id ], async (api, userId, signal) => {
    if (item!.Type !== BaseItemKind.Series) return item!;

    const seriesId = item!.Id!;
    const resume = await getLibraryApi(api).getResumeItems({ userId, parentId: seriesId, limit: 1, mediaTypes: [ MediaType.Video ] }, { signal });
    if (resume.data.Items?.length) return resume.data.Items[0];

    const nextUp = await getShowApi(api).getNextUp({ userId, seriesId, limit: 1, enableResumable: false }, { signal });
    if (nextUp.data.Items?.length) return nextUp.data.Items[0];

    const episodes = await getShowApi(api).getEpisodes({ seriesId, userId, limit: 1 }, { signal });
    return episodes.data.Items?.[0] ?? null;
}, !!item);

/** My List, thumbs and watched state. Every change refreshes the title and the personalized rows. */
export const useTitleActions = (item: BaseItemDto | undefined) => {
    const { api, user } = useApi();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (action: 'toggleFavorite' | 'like' | 'dislike' | 'clearRating' | 'markPlayed' | 'markUnplayed') => {
            if (!api || !user?.Id || !item?.Id) throw new Error('[JellyFlix] No API or item available');
            const userData = getUserDataApi(api);
            const params = { itemId: item.Id, userId: user.Id };
            switch (action) {
                case 'toggleFavorite':
                    return item.UserData?.IsFavorite ? userData.unmarkFavoriteItem(params) : userData.markFavoriteItem(params);
                case 'like':
                    return userData.updateUserItemRating({ ...params, likes: true });
                case 'dislike':
                    return userData.updateUserItemRating({ ...params, likes: false });
                case 'clearRating':
                    return userData.deleteUserItemRating(params);
                case 'markPlayed':
                    return userData.markPlayedItem(params);
                case 'markUnplayed':
                    return userData.markUnplayedItem(params);
            }
        },
        onSuccess: () => Promise.all([
            queryClient.invalidateQueries({ queryKey: KEY }),
            queryClient.invalidateQueries({ queryKey: [ 'JellyFlix', 'Home' ] }),
            queryClient.invalidateQueries({ queryKey: [ 'JellyFlix', 'Recommendations' ] })
        ])
    });
};
