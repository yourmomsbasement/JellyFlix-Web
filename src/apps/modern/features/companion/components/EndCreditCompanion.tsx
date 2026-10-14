import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { type FC, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import layoutManager from 'components/layoutManager';
import { playbackManager } from 'components/playback/playbackmanager';
import Events from 'utils/events';

/** A movie counts as finished once the credits are rolling. */
export const FINISHED_SHARE = 0.9;

interface PlaybackStopInfo {
    state?: {
        NowPlayingItem?: BaseItemDto | null
        PlayState?: { PositionTicks?: number | null }
    }
    nextItem?: unknown
}

/** The movie that just finished, if the stop means "the end" rather than "stop for now" or "play the next one". */
export const getFinishedMovie = (info: PlaybackStopInfo | undefined) => {
    const item = info?.state?.NowPlayingItem;
    const position = info?.state?.PlayState?.PositionTicks ?? 0;
    if (!item?.Id || item.Type !== BaseItemKind.Movie || info?.nextItem || !item.RunTimeTicks) return undefined;
    return position >= item.RunTimeTicks * FINISHED_SHARE ? item : undefined;
};

/**
 * When a movie ends, opens the end-credit companion: the next film in its collection, extras, the soundtrack and
 * more like it. Waits for the player to close first, so Back from the companion returns to where playback started.
 */
const EndCreditCompanion: FC = () => {
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const [ finishedId, setFinishedId ] = useState<string>();

    useEffect(() => {
        const onPlaybackStop = (_e: unknown, info: PlaybackStopInfo) => {
            // The companion page is part of the modern and TV layouts only
            if (!layoutManager.modern && !layoutManager.tv) return;
            const movie = getFinishedMovie(info);
            if (movie?.Id) setFinishedId(movie.Id);
        };
        Events.on(playbackManager, 'playbackstop', onPlaybackStop);
        return () => Events.off(playbackManager, 'playbackstop', onPlaybackStop);
    }, []);

    useEffect(() => {
        if (!finishedId || pathname === '/video') return;
        setFinishedId(undefined);
        navigate(`/companion?id=${finishedId}`);
    }, [ finishedId, pathname, navigate ]);

    return null;
};

export default EndCreditCompanion;
