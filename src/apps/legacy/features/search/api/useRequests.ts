import type { Api } from '@jellyfin/sdk';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

import { useApi } from 'hooks/useApi';

/** Where a title stands in Seerr, from the JellyFlix plugin. */
export type RequestStatus = 'None' | 'Requested' | 'Processing' | 'PartiallyAvailable' | 'Available' | 'Blocked';

export interface RequestableTitle {
    TmdbId: number
    MediaType: 'movie' | 'tv'
    Title: string
    Year: number | null
    Overview: string | null
    PosterUrl: string | null
    Status: RequestStatus
}

export interface RequestSearch {
    IsEnabled: boolean
    CanRequest: boolean
    Results: RequestableTitle[]
}

const QUERY_KEY = [ 'JellyFlix', 'Requests' ];

const authorization = (api: Api) => ({ Authorization: api.authorizationHeader });

/** The error Seerr or the plugin gave, in words. */
export const getRequestError = (error: unknown) => {
    if (isAxiosError<{ detail?: string }>(error)) return error.response?.data?.detail ?? error.message;
    return error instanceof Error ? error.message : String(error);
};

/**
 * Movies and shows matching a search that aren't in the library, from Seerr through the JellyFlix plugin. Resolves to
 * null when the plugin isn't installed, or is too old to have requests.
 */
export const useRequestSearch = (query: string | undefined) => {
    const { api, user } = useApi();
    return useQuery({
        queryKey: [ ...QUERY_KEY, 'Search', query, user?.Id ],
        queryFn: async ({ signal }) => {
            try {
                const response = await api!.axiosInstance.get<RequestSearch>(`${api!.basePath}/JellyFlix/Requests/Search`, {
                    params: { query },
                    headers: authorization(api!),
                    signal
                });
                return response.data;
            } catch (err) {
                // No plugin, or Seerr is down: search still works, just without request cards
                if (isAxiosError(err) && err.response && err.response.status >= 400) {
                    console.warn('[JellyFlix] requests unavailable', getRequestError(err));
                    return null;
                }
                throw err;
            }
        },
        enabled: !!api && !!user?.Id && !!query?.trim(),
        // Always ask again: availability changes as requests come in, and so do the settings
        staleTime: 0,
        meta: { persist: false },
        retry: false
    });
};

export const useCreateRequest = () => {
    const { api } = useApi();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (title: Pick<RequestableTitle, 'TmdbId' | 'MediaType'>) => api!.axiosInstance.post(
            `${api!.basePath}/JellyFlix/Requests`,
            { TmdbId: title.TmdbId, MediaType: title.MediaType },
            { headers: authorization(api!) }
        ),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: [ ...QUERY_KEY, 'Search' ] })
    });
};
