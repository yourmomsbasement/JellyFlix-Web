import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';

import { playbackManager } from 'components/playback/playbackmanager';
import { appRouter } from 'components/router/appRouter';
import globalize from 'lib/globalize';
import type { ItemDto } from 'types/base/models/item-dto';

const TICKS_PER_MINUTE = 600_000_000;

const formatRuntime = (ticks: number) => {
    const minutes = Math.round(ticks / TICKS_PER_MINUTE);
    const hours = Math.floor(minutes / 60);
    if (!hours) return `${minutes}m`;
    return minutes % 60 ? `${hours}h ${minutes % 60}m` : `${hours}h`;
};

/** "S1:E3", Netflix-style. */
export const getEpisodeLabel = (item: BaseItemDto) =>
    item.Type === BaseItemKind.Episode && item.ParentIndexNumber != null && item.IndexNumber != null ?
        `S${item.ParentIndexNumber}:E${item.IndexNumber}` :
        undefined;

/** The short metadata line under a title: year, rating and length. */
export const getMetaParts = (item: BaseItemDto) => {
    const parts: string[] = [];
    if (item.ProductionYear) parts.push(String(item.ProductionYear));
    if (item.OfficialRating) parts.push(item.OfficialRating);
    if (item.Type === BaseItemKind.Series) {
        if (item.ChildCount) parts.push(globalize.translate(item.ChildCount === 1 ? 'SeasonCountSingular' : 'SeasonCount', String(item.ChildCount)));
    } else if (item.RunTimeTicks) {
        parts.push(formatRuntime(item.RunTimeTicks));
    }
    return parts;
};

/** The display title; episodes show their series name, with the episode underneath. */
export const getDisplayTitle = (item: BaseItemDto) =>
    item.Type === BaseItemKind.Episode ? item.SeriesName ?? item.Name ?? '' : item.Name ?? '';

export const getPlayedPercentage = (item: BaseItemDto) => item.UserData?.PlayedPercentage ?? 0;

/** Plays an item, resuming where the profile left off. */
export const playItem = (item: BaseItemDto) => {
    playbackManager.play({
        items: [ item as ItemDto ],
        startPositionTicks: item.UserData?.PlaybackPositionTicks ?? 0
    }).catch(err => {
        console.error('[JellyFlix] failed to play item', err);
    });
};

/** Opens a title. Episodes open their show's page at their season, like Netflix. */
export const openItem = (item: BaseItemDto) => {
    if (item.Type === BaseItemKind.Episode && item.SeriesId) {
        const season = item.SeasonId ? `&seasonId=${item.SeasonId}` : '';
        void appRouter.show(`/title?id=${item.SeriesId}${season}&serverId=${item.ServerId ?? ''}`);
        return;
    }
    appRouter.showItem(item);
};

/** Whether a title has a local or online trailer. */
export const hasTrailer = (item: BaseItemDto) => !!item.LocalTrailerCount || !!item.RemoteTrailers?.length;

/** Plays a title's trailers. */
export const playTrailer = (item: BaseItemDto) => {
    playbackManager.playTrailers(item).catch((err: unknown) => {
        console.error('[JellyFlix] failed to play trailer', err);
    });
};
