import type { Api } from '@jellyfin/sdk';
import type { AuthenticationResult } from '@jellyfin/sdk/lib/generated-client/models/authentication-result';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError, type AxiosRequestConfig } from 'axios';

import { useApi } from 'hooks/useApi';
import { ServerConnections } from 'lib/jellyfin-apiclient';

import { markProfileSwitch } from '../startup';

/** A profile in the household, as returned by the JellyFlix Profiles server plugin. */
export interface Profile {
    Id: string
    Name: string
    AvatarColor: string
    /** The generated avatar, e.g. "cat"; missing before plugin 1.2.1. */
    AvatarIcon?: string | null
    PrimaryImageTag?: string | null
    HasPin: boolean
    IsKids: boolean
    IsOwner: boolean
}

export interface Household {
    OwnerId: string
    CurrentProfileId: string
    CanManage: boolean
    MaxProfiles: number
    Profiles: Profile[]
}

export interface ProfileInput {
    Name?: string
    AvatarColor?: string
    /** An empty string goes back to the smiley. */
    AvatarIcon?: string
    IsKids?: boolean
    Pin?: string
    RemovePin?: boolean
}

/** Error codes the plugin returns in `{ Error, Message }` bodies. */
export type ProfileErrorCode = 'BadRequest' | 'Forbidden' | 'NotFound' | 'ProfileLimitReached' | 'InvalidPin' | 'PinLocked';

export const AVATAR_COLORS = [ '#E50914', '#0071EB', '#F5C518', '#2BB673', '#8E44AD', '#FF7A00', '#E91E63', '#00A8A8', '#546E7A', '#6D4C41' ];

const HOUSEHOLD_QUERY_KEY = [ 'JellyFlix', 'Household' ];

const request = <T>(api: Api, method: 'GET' | 'POST' | 'DELETE', path: string, data?: unknown, options?: AxiosRequestConfig) =>
    api.axiosInstance.request<T>({
        ...options,
        method,
        url: `${api.basePath}/JellyFlix/Profiles${path}`,
        data,
        headers: { Authorization: api.authorizationHeader }
    }).then(response => response.data);

/** Gets the error code from a failed profile request, if the plugin sent one. */
export const getProfileErrorCode = (error: unknown): ProfileErrorCode | undefined => {
    if (isAxiosError<{ Error?: ProfileErrorCode }>(error)) {
        return error.response?.data?.Error;
    }
};

/** Whether a failed request means the server doesn't have the profiles plugin installed. */
export const isPluginMissing = (error: unknown) =>
    isAxiosError(error) && error.response?.status === 404 && !getProfileErrorCode(error);

export const getProfileImageUrl = (api: Api | undefined, profile: Profile) => {
    if (!api || !profile.PrimaryImageTag) return undefined;
    return `${api.basePath}/Users/${profile.Id}/Images/Primary?tag=${profile.PrimaryImageTag}&quality=90&maxHeight=320`;
};

export const useHousehold = () => {
    const { api, user } = useApi();
    return useQuery({
        queryKey: [ ...HOUSEHOLD_QUERY_KEY, user?.Id ],
        queryFn: ({ signal }) => request<Household>(api!, 'GET', '', undefined, { signal }),
        enabled: !!api && !!user,
        retry: false
    });
};

const useHouseholdMutation = <TVariables, TResult>(fn: (api: Api, variables: TVariables) => Promise<TResult>) => {
    const { api } = useApi();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (variables: TVariables) => {
            if (!api) throw new Error('[profiles] No API instance available');
            return fn(api, variables);
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: HOUSEHOLD_QUERY_KEY })
    });
};

export const useCreateProfile = () => useHouseholdMutation(
    (api, input: ProfileInput) => request<Profile>(api, 'POST', '', input));

export const useUpdateProfile = () => useHouseholdMutation(
    (api, { id, input }: { id: string, input: ProfileInput }) => request<Profile>(api, 'POST', `/${id}`, input));

/** Sets a profile's photo: a JPEG, PNG or WebP image. */
export const useSetProfileImage = () => useHouseholdMutation(
    (api, { id, image }: { id: string, image: Blob }) => api.axiosInstance.post(`${api.basePath}/JellyFlix/Profiles/${id}/Image`, image, {
        headers: { Authorization: api.authorizationHeader, 'Content-Type': image.type || 'image/jpeg' }
    }));

/** Removes a profile's photo, so its generated avatar shows again. */
export const useRemoveProfileImage = () => useHouseholdMutation(
    (api, id: string) => request<void>(api, 'DELETE', `/${id}/Image`));

export const useDeleteProfile = () => useHouseholdMutation(
    (api, id: string) => request<void>(api, 'DELETE', `/${id}`));

/**
 * Switches this device to another profile. The server signs out the current session, so the
 * app is reloaded afterwards to drop everything cached for the previous profile.
 */
export const switchToProfile = async (api: Api, profileId: string, pin?: string, target = '/home') => {
    const result = await request<AuthenticationResult>(api, 'POST', `/${profileId}/Switch`, { Pin: pin });

    // Store the new session exactly like a normal sign in does.
    const apiClient = ServerConnections.currentApiClient();
    if (!apiClient?.onAuthenticated) throw new Error('[profiles] No API client available');
    await apiClient.onAuthenticated(apiClient, result);

    markProfileSwitch();
    window.location.hash = '#' + target;
    window.location.reload();
};
