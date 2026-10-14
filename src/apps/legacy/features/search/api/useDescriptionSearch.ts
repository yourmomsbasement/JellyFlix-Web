import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

import { useApi } from 'hooks/useApi';

export interface DescriptionSearch {
    Items: BaseItemDto[]
    /** Whether titles were matched by meaning as well as by words. */
    IsSemantic: boolean
}

/**
 * Movies and shows whose metadata matches a description ("space movie with a stranded astronaut"), from the
 * JellyFlix plugin. Resolves to null when the plugin isn't installed, or is too old to search by description.
 */
export const useDescriptionSearch = (query: string | undefined) => {
    const { api, user } = useApi();
    return useQuery({
        queryKey: [ 'JellyFlix', 'DescriptionSearch', query, user?.Id ],
        queryFn: async ({ signal }) => {
            try {
                const response = await api!.axiosInstance.get<DescriptionSearch>(`${api!.basePath}/JellyFlix/Search`, {
                    params: { query, limit: 24 },
                    headers: { Authorization: api!.authorizationHeader },
                    signal
                });
                return response.data;
            } catch (err) {
                if (isAxiosError(err) && err.response && err.response.status >= 400) return null;
                throw err;
            }
        },
        enabled: !!api && !!user?.Id && !!query?.trim(),
        meta: { persist: false },
        retry: false
    });
};

/** Description matches that name search doesn't already show. */
export const getDescriptionOnlyMatches = (data: DescriptionSearch | null | undefined, query: string) => {
    const needle = query.trim().toLowerCase();
    return (data?.Items ?? []).filter(item => !item.Name?.toLowerCase().includes(needle));
};
