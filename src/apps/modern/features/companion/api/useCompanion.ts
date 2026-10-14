import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

import { useApi } from 'hooks/useApi';

/** What to offer once a title finishes, from the JellyFlix plugin. */
export interface Companion {
    CollectionName: string | null
    NextInCollection: BaseItemDto | null
    Extras: BaseItemDto[]
    Composers: string[]
    Soundtracks: BaseItemDto[]
}

/** Resolves to null when the plugin isn't installed or is too old. */
export const useCompanion = (itemId: string | undefined) => {
    const { api, user } = useApi();
    return useQuery({
        queryKey: [ 'JellyFlix', 'Companion', itemId, user?.Id ],
        queryFn: async ({ signal }) => {
            try {
                const response = await api!.axiosInstance.get<Companion>(`${api!.basePath}/JellyFlix/Companion/${itemId}`, {
                    headers: { Authorization: api!.authorizationHeader },
                    signal
                });
                return response.data;
            } catch (err) {
                if (isAxiosError(err) && err.response && err.response.status >= 400) return null;
                throw err;
            }
        },
        enabled: !!api && !!user?.Id && !!itemId,
        staleTime: 0,
        meta: { persist: false },
        retry: false
    });
};
