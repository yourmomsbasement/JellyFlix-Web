import type { Api } from '@jellyfin/sdk';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api';
import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

import { useApi } from 'hooks/useApi';

/** Responses from the JellyFlix Recommendations server plugin. */
export interface Recommendations {
    /** False when the profile has no history yet and the picks are just well-rated, recent titles. */
    IsPersonalized: boolean
    Recommended: { Item: BaseItemDto, Reasons: string[] }[]
    BecauseYouWatched: { SeedId: string, SeedName: string, Items: BaseItemDto[] }[]
}

export interface Similar {
    /** Netflix-style match percentage, or null without history (or without the plugin). */
    Match: number | null
    Items: BaseItemDto[]
}

const ROOT_KEY = [ 'JellyFlix', 'Recommendations' ];

const get = <T>(api: Api, path: string, signal: AbortSignal) =>
    api.axiosInstance.get<T>(`${api.basePath}/JellyFlix/Recommendations${path}`, {
        headers: { Authorization: api.authorizationHeader },
        signal
    }).then(response => response.data);

/**
 * Top Picks and Because-you-watched rows. Resolves to null when the server doesn't have the plugin, so callers can
 * simply skip those rows.
 */
export const useRecommendations = () => {
    const { api, user } = useApi();
    return useQuery({
        queryKey: [ ...ROOT_KEY, 'Home', user?.Id ],
        queryFn: async ({ signal }) => {
            try {
                return await get<Recommendations>(api!, '?limit=20&rows=2&rowLength=20', signal);
            } catch (err) {
                if (isAxiosError(err) && err.response?.status === 404) return null;
                throw err;
            }
        },
        enabled: !!api && !!user?.Id,
        // Recommendations shift as the profile watches; refresh when coming back to Home
        staleTime: 0
    });
};

/**
 * "More Like This" and the match percentage for a title. Falls back to Jellyfin's built-in similar items when the
 * plugin isn't installed.
 */
export const useSimilar = (itemId: string | undefined) => {
    const { api, user } = useApi();
    return useQuery({
        queryKey: [ ...ROOT_KEY, 'Similar', itemId, user?.Id ],
        queryFn: async ({ signal }): Promise<Similar> => {
            try {
                return await get<Similar>(api!, `/Similar/${itemId}?limit=18`, signal);
            } catch (err) {
                if (!isAxiosError(err) || err.response?.status !== 404) throw err;
                const { data } = await getLibraryApi(api!).getSimilarItems({ itemId: itemId!, userId: user!.Id, limit: 18 }, { signal });
                return { Match: null, Items: data.Items ?? [] };
            }
        },
        enabled: !!api && !!user?.Id && !!itemId
    });
};
