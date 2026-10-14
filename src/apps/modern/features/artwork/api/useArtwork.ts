import type { Api } from '@jellyfin/sdk';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

import { useApi } from 'hooks/useApi';

export type ArtworkKind = 'Poster' | 'Backdrop';

/** Images a profile sees instead of the library's: paths under the server. */
export interface TitleArtwork {
    Poster?: string | null
    Backdrop?: string | null
}

export interface ArtworkOption {
    Id: string
    /** A path under the server ("Items/…") or a full URL. */
    PreviewUrl: string
    Source: string
    Width: number | null
    Height: number | null
    Language: string | null
    IsDefault: boolean
    IsSelected: boolean
}

export interface ArtworkOptions {
    Options: ArtworkOption[]
    ProvidersFailed: boolean
}

const QUERY_KEY = [ 'JellyFlix', 'Artwork' ];

const authorization = (api: Api) => ({ Authorization: api.authorizationHeader });

let overrides: Record<string, TitleArtwork> = {};

/** The image a profile chose for a title, as a URL, or undefined for the library's. */
export const getArtworkOverride = (api: Api, itemId: string, kind: ArtworkKind, maxWidth: number) => {
    const path = overrides[itemId]?.[kind];
    if (!path) return undefined;
    if (/^https?:\/\//i.test(path)) return path;
    const url = `${api.basePath}/${path}`;
    // The library's images can be scaled by the server; downloaded ones are served as they are
    return path.startsWith('Items/') ? `${url}&maxWidth=${maxWidth}&quality=90` : url;
};

/** Turns an option's preview into a URL. */
export const getPreviewUrl = (api: Api, option: ArtworkOption, maxWidth: number) => (
    /^https?:\/\//i.test(option.PreviewUrl) ? option.PreviewUrl : `${api.basePath}/${option.PreviewUrl}&maxWidth=${maxWidth}&quality=80`
);

/**
 * The signed-in profile's artwork choices. Components that draw posters or backdrops call this, so they redraw once
 * the choices arrive or change; the image helpers then use them.
 */
export const useArtworkOverrides = () => {
    const { api, user } = useApi();
    const query = useQuery({
        queryKey: [ ...QUERY_KEY, 'Overrides', user?.Id ],
        queryFn: async ({ signal }) => {
            try {
                const response = await api!.axiosInstance.get<Record<string, TitleArtwork>>(`${api!.basePath}/JellyFlix/Artwork`, {
                    headers: authorization(api!),
                    signal
                });
                return response.data;
            } catch (err) {
                // No plugin, or one without artwork choices
                if (isAxiosError(err) && err.response && err.response.status >= 400) return null;
                throw err;
            }
        },
        enabled: !!api && !!user?.Id,
        staleTime: 5 * 60_000,
        retry: false
    });
    overrides = query.data ?? {};
    // Null when the server can't keep artwork choices
    return query.data;
};

export const useArtworkOptions = (itemId: string | undefined, kind: ArtworkKind, enabled: boolean) => {
    const { api, user } = useApi();
    return useQuery({
        queryKey: [ ...QUERY_KEY, 'Options', itemId, kind, user?.Id ],
        queryFn: async ({ signal }) => (await api!.axiosInstance.get<ArtworkOptions>(`${api!.basePath}/JellyFlix/Artwork/${itemId}/Options`, {
            params: { kind },
            headers: authorization(api!),
            signal
        })).data,
        enabled: !!api && !!user?.Id && !!itemId && enabled,
        staleTime: 0,
        meta: { persist: false },
        retry: false
    });
};

/** Chooses an option, or goes back to the library's image when optionId is null. */
export const useChooseArtwork = (itemId: string | undefined) => {
    const { api } = useApi();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ kind, optionId }: { kind: ArtworkKind, optionId: string | null }) => (optionId ?
            api!.axiosInstance.post(`${api!.basePath}/JellyFlix/Artwork/${itemId}`, { Kind: kind, OptionId: optionId }, { headers: authorization(api!) }) :
            api!.axiosInstance.delete(`${api!.basePath}/JellyFlix/Artwork/${itemId}`, { params: { kind }, headers: authorization(api!) })),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    });
};
