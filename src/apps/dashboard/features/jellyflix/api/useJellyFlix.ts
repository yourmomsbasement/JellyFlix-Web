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
    /** Missing before plugin 1.0.1. */
    ServeWebClient?: boolean
    WebReleasesRepository: string
    GitHubApiUrl: string
    /** The request settings are missing before plugin 1.1.0. */
    RequestsEnabled?: boolean
    SeerrUrl?: string
    SeerrApiKey?: string
    AllowKidsRequests?: boolean
    /** The search settings are missing before plugin 1.2.0. */
    SemanticSearchEnabled?: boolean
    EmbeddingsUrl?: string
    EmbeddingsModel?: string
    EmbeddingsApiKey?: string
}

/** The state of description search. */
export interface SearchStatus {
    IsSemanticEnabled: boolean
    Titles: number
    EmbeddedTitles: number
    Model: string | null
    LastBuild: string | null
    /** From 0 to 100 while the embeddings are being built, otherwise null. */
    BuildProgress: number | null
    LastBuildResult: string | null
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

const CONFIGURATION_KEY = [ ...QUERY_KEY, 'Configuration' ];

const getConfiguration = (api: Api, signal?: AbortSignal) => orNullWithoutPlugin(
    // The timestamp keeps browsers and proxies from answering with a cached copy
    request<JellyFlixConfiguration>(api, 'GET', `/Plugins/${JELLYFLIX_PLUGIN_ID}/Configuration?_=${Date.now()}`, undefined, signal)
);

/** Settings are always read fresh from the server: never from the app's offline cache. */
const FRESH = { staleTime: 0, meta: { persist: false } };

export const useJellyFlixConfiguration = () => {
    const { api } = useApi();
    return useQuery({
        queryKey: CONFIGURATION_KEY,
        queryFn: ({ signal }) => getConfiguration(api!, signal),
        enabled: !!api,
        ...FRESH
    });
};

/** Thrown when the server accepted new settings but reads back something else. */
export class SettingsNotKeptError extends Error {
    constructor(public readonly settings: string[]) {
        super(`The server did not keep: ${settings.join(', ')}`);
    }
}

export const useWebUpdateStatus = () => {
    const { api } = useApi();
    return useQuery({
        queryKey: [ ...QUERY_KEY, 'WebUpdate' ],
        queryFn: ({ signal }) => orNullWithoutPlugin(request<WebUpdateStatus>(api!, 'GET', `/JellyFlix/WebUpdate?_=${Date.now()}`, undefined, signal)),
        enabled: !!api,
        ...FRESH
    });
};

export const useSaveJellyFlixConfiguration = () => {
    const { api } = useApi();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (configuration: JellyFlixConfiguration) => {
            await request<void>(api!, 'POST', `/Plugins/${JELLYFLIX_PLUGIN_ID}/Configuration`, configuration);

            // Read the settings back, so a save the server didn't keep can't look like it worked
            const saved = await getConfiguration(api!);
            queryClient.setQueryData(CONFIGURATION_KEY, saved);
            const notKept = (Object.keys(configuration) as (keyof JellyFlixConfiguration)[])
                .filter(key => saved?.[key] !== configuration[key]);
            if (notKept.length) throw new SettingsNotKeptError(notKept);
        },
        onSettled: () => queryClient.invalidateQueries({ queryKey: [ ...QUERY_KEY, 'WebUpdate' ] })
    });
};

/** Checks the Seerr connection with the saved settings; resolves to Seerr's version. */
export const useTestSeerr = () => {
    const { api } = useApi();
    return useMutation({
        mutationFn: async () => (await request<{ Version: string }>(api!, 'POST', '/JellyFlix/Requests/Test')).Version
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

const SEARCH_STATUS_KEY = [ ...QUERY_KEY, 'SearchStatus' ];

/** Polls while the embeddings are being built. */
export const useSearchStatus = (enabled: boolean) => {
    const { api } = useApi();
    return useQuery({
        queryKey: SEARCH_STATUS_KEY,
        queryFn: ({ signal }) => orNullWithoutPlugin(request<SearchStatus>(api!, 'GET', `/JellyFlix/Search/Status?_=${Date.now()}`, undefined, signal)),
        enabled: !!api && enabled,
        refetchInterval: query => (query.state.data?.BuildProgress != null ? 1500 : false),
        ...FRESH
    });
};

/** Checks the embeddings API with the saved settings. */
export const useTestEmbeddings = () => {
    const { api } = useApi();
    return useMutation({
        mutationFn: () => request<{ Model: string, Dimensions: number }>(api!, 'POST', '/JellyFlix/Search/Test')
    });
};

/** Starts embedding new and changed titles; the status then polls until it's done. */
export const useBuildSearchIndex = () => {
    const { api } = useApi();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => request<SearchStatus>(api!, 'POST', '/JellyFlix/Search/Build'),
        onSuccess: status => queryClient.setQueryData(SEARCH_STATUS_KEY, status)
    });
};
