import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import { getUserDataApi } from '@jellyfin/sdk/lib/utils/api/user-data-api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import toast from 'components/toast/toast';
import { useApi } from 'hooks/useApi';
import globalize from 'lib/globalize';

/** What can be done to a tile in Continue Watching / Next Up. */
export type WatchAction =
    /** Mark this movie or episode watched. */
    | 'markWatched'
    /** Mark every episode of the episode's show watched. */
    | 'markShowWatched'
    /** Forget the resume position, without changing whether it was ever watched. */
    | 'removeFromContinueWatching';

const TOAST_KEYS: Record<WatchAction, string> = {
    markWatched: 'MarkedAsWatched',
    markShowWatched: 'MarkedShowAsWatched',
    removeFromContinueWatching: 'RemovedFromContinueWatching'
};

/**
 * Housekeeping for the "in progress" rows. Afterwards every JellyFlix row is refreshed, so the tile disappears,
 * Next Up moves on to the following episode and recommendations account for it.
 */
export const useWatchActions = () => {
    const { api, user } = useApi();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ action, item }: { action: WatchAction, item: BaseItemDto }) => {
            if (!api || !user?.Id || !item.Id) throw new Error('[JellyFlix] No API or item available');
            const userData = getUserDataApi(api);
            const userId = user.Id;
            switch (action) {
                case 'markWatched':
                    return userData.markPlayedItem({ itemId: item.Id, userId });
                case 'markShowWatched':
                    if (!item.SeriesId) throw new Error('[JellyFlix] Item has no show');
                    return userData.markPlayedItem({ itemId: item.SeriesId, userId });
                case 'removeFromContinueWatching':
                    return userData.updateItemUserData({
                        itemId: item.Id,
                        userId,
                        updateUserItemDataDto: { PlaybackPositionTicks: 0 }
                    });
            }
        },
        onSuccess: (_data, { action }) => {
            toast(globalize.translate(TOAST_KEYS[action]));
            return queryClient.invalidateQueries({ queryKey: [ 'JellyFlix' ] });
        },
        onError: err => {
            console.error('[JellyFlix] failed to update watch state', err);
            toast(globalize.translate('ErrorDefault'));
        }
    });
};
