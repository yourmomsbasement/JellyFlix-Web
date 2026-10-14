import type { Api } from '@jellyfin/sdk';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

import { useApi } from 'hooks/useApi';

/** The JellyFlix server plugin (JellyFlix-Plugin). */
export const JELLYFLIX_PLUGIN_ID = 'c1a2981e3ba244c5936083cf293c2a13';

/** The plugin's server-wide settings. */
export interface JellyFlixConfiguration {
    MaxProfilesPerHousehold: number
    AllowNonAdminOwners: boolean
    KidsMaxParentalRating: number
    WebUpdatesEnabled: boolean
    ServeWebClient: boolean
    WebReleasesRepository: string
    GitHubApiUrl: string
}

/** What the plugin's web updater reports. */
export interface WebUpdateStatus {
    Enabled: boolean
    InstallPath: string
    ServerWebPath: string
    IsServerUsingInstall: boolean
    IsServedByPlugin: boolean
    Installed: { Version: string, Commit: string, ServerVersion: string, InstalledAt: string } | null
    LatestVersion: string | null
    LastCheck: string | null
    LastResult: string | null
}

const QUERY_KEY = [ 'JellyFlix', 'Dashboard' ];

const request = async <T>(api: Api, method: 'GET' | 'POST', path: string, data?: unknown, signal?: AbortSignal) => {
    const response = await api.axiosInstance.request<T>({
        method,
        url: `${api.basePath}${path}`,
        data,
        headers: { Authorization: api.authorizationHeader },
        signal
    });
    return response.data;
};

/** Resolves to null when the server doesn't have the JellyFlix plugin. */
const orNullWithoutPlugin = async <T>(promise: Promise<T>) => {
    try {
        return await promise;
    } catch (err) {
        if (isAxiosError(err) && err.response?.status === 404) return null;
        throw err;
    }
};

export const useJellyFlixConfiguration = () => {
    const { api } = useApi();
    return useQuery({
        queryKey: [ ...QUERY_KEY, 'Configuration' ],
        queryFn: ({ signal }) => orNullWithoutPlugin(
            request<JellyFlixConfiguration>(api!, 'GET', `/Plugins/${JELLYFLIX_PLUGIN_ID}/Configuration`, undefined, signal)
        ),
        enabled: !!api
    });
};

export const useWebUpdateStatus = () => {
    const { api } = useApi();
    return useQuery({
        queryKey: [ ...QUERY_KEY, 'WebUpdate' ],
        queryFn: ({ signal }) => orNullWithoutPlugin(request<WebUpdateStatus>(api!, 'GET', '/JellyFlix/WebUpdate', undefined, signal)),
        enabled: !!api
    });
};

export const useSaveJellyFlixConfiguration = () => {
    const { api } = useApi();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (configuration: JellyFlixConfiguration) =>
            request<void>(api!, 'POST', `/Plugins/${JELLYFLIX_PLUGIN_ID}/Configuration`, configuration),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    });
};

export const useCheckForWebUpdates = () => {
    const { api } = useApi();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => request<WebUpdateStatus>(api!, 'POST', '/JellyFlix/WebUpdate/Check'),
        onSuccess: status => queryClient.setQueryData([ ...QUERY_KEY, 'WebUpdate' ], status)
    });
};
