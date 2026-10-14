import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

import { getBackdropUrl, getPosterUrl } from 'apps/modern/features/home/utils/images';
import { useApi } from 'hooks/useApi';

import { extractAccentColor } from '../utils/accentColor';

export type Season = 'None' | 'Halloween' | 'Christmas' | 'Summer';

export interface SeasonalShelf {
    /** The shelf's string key, e.g. "SeasonalHalloweenPicks". */
    Key: string
    Items: BaseItemDto[]
}

export interface Appearance {
    Season: Season
    DynamicColors: boolean
    Shelves: SeasonalShelf[]
}

/** The look the JellyFlix plugin asks for: the season and its shelves, and dynamic colors. Null without the plugin. */
export const useAppearance = () => {
    const { api, user } = useApi();
    return useQuery({
        queryKey: [ 'JellyFlix', 'Appearance', user?.Id ],
        queryFn: async ({ signal }) => {
            try {
                const response = await api!.axiosInstance.get<Appearance>(`${api!.basePath}/JellyFlix/Appearance`, {
                    headers: { Authorization: api!.authorizationHeader },
                    signal
                });
                return response.data;
            } catch (err) {
                if (isAxiosError(err) && err.response && err.response.status >= 400) return null;
                throw err;
            }
        },
        enabled: !!api && !!user?.Id,
        staleTime: 10 * 60_000,
        // Not kept in the offline cache, so a changed season or setting shows on the next app load
        meta: { persist: false },
        retry: false
    });
};

/**
 * A subtle accent color from a title's artwork, when dynamic colors are on: undefined while it's worked out or when
 * they're off, null when the artwork has no clear color.
 */
export const useDynamicAccent = (item: BaseItemDto | null | undefined) => {
    const { api } = useApi();
    const { data: appearance } = useAppearance();
    // A small image is plenty to find a color in
    const url = item ? getBackdropUrl(api, item, 160) ?? getPosterUrl(api, item, 120) : undefined;
    const { data } = useQuery({
        queryKey: [ 'JellyFlix', 'Accent', url ],
        queryFn: () => extractAccentColor(url!),
        enabled: !!url && !!appearance?.DynamicColors,
        staleTime: Infinity,
        gcTime: 60 * 60_000,
        meta: { persist: false }
    });
    return appearance?.DynamicColors ? data : undefined;
};
