import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import type { MediaSourceInfo } from '@jellyfin/sdk/lib/generated-client/models/media-source-info';
import type { MediaStream } from '@jellyfin/sdk/lib/generated-client/models/media-stream';
import { MediaStreamType } from '@jellyfin/sdk/lib/generated-client/models/media-stream-type';

/** One file (version) of a movie or episode, summarized for people rather than for players. */
export interface MediaVersionInfo {
    /** The version's name, when a title has several (e.g. "4K", "Director's Cut"). */
    name?: string
    container?: string
    /** "4K", "1080p", ... */
    resolution?: string
    videoCodec?: string
    /** "Dolby Vision", "HDR10", ...; undefined for SDR. */
    hdr?: string
    /** "8.4 GB". */
    size?: string
    /** "24.1 Mbps". */
    bitrate?: string
    /** One line per audio track, e.g. "English - Dolby TrueHD + Dolby Atmos - 7.1 - Default". */
    audio: string[]
    /** One line per subtitle track. */
    subtitles: string[]
}

const CODEC_NAMES: Record<string, string> = {
    h264: 'H.264',
    hevc: 'HEVC (H.265)',
    h265: 'HEVC (H.265)',
    av1: 'AV1',
    vp9: 'VP9',
    vp8: 'VP8',
    mpeg2video: 'MPEG-2',
    mpeg4: 'MPEG-4',
    vc1: 'VC-1'
};

const getResolution = (video: MediaStream) => {
    const width = video.Width ?? 0;
    const height = video.Height ?? 0;
    // Widescreen films are short for their width, so judge by either side
    if (width >= 3800 || height >= 2100) return '4K';
    if (width >= 2500 || height >= 1400) return '1440p';
    if (width >= 1900 || height >= 1000) return '1080p';
    if (width >= 1260 || height >= 700) return '720p';
    return height ? `${height}p (SD)` : undefined;
};

const getHdr = (video: MediaStream) => {
    const type = String(video.VideoRangeType ?? '');
    if (type.startsWith('DOVI')) return 'Dolby Vision';
    if (type === 'HDR10Plus') return 'HDR10+';
    if (type === 'HDR10') return 'HDR10';
    if (type === 'HLG') return 'HLG';
    return video.VideoRange === 'HDR' ? 'HDR' : undefined;
};

const formatSize = (bytes: number) => {
    const gb = bytes / 1024 ** 3;
    return gb >= 1 ? `${gb.toFixed(1)} GB` : `${Math.max(1, Math.round(bytes / 1024 ** 2))} MB`;
};

const formatBitrate = (bitsPerSecond: number) => {
    const mbps = bitsPerSecond / 1_000_000;
    return mbps >= 1 ? `${mbps.toFixed(1)} Mbps` : `${Math.round(bitsPerSecond / 1000)} kbps`;
};

const streamsOf = (source: MediaSourceInfo, type: MediaStreamType) =>
    (source.MediaStreams ?? []).filter(stream => stream.Type === type);

const describe = (source: MediaSourceInfo, hasVersions: boolean): MediaVersionInfo => {
    const video = streamsOf(source, MediaStreamType.Video)[0];
    const codec = video?.Codec?.toLowerCase();
    return {
        name: hasVersions ? source.Name ?? undefined : undefined,
        container: source.Container?.toUpperCase(),
        resolution: video && getResolution(video),
        videoCodec: codec && (CODEC_NAMES[codec] ?? codec.toUpperCase()),
        hdr: video && getHdr(video),
        size: source.Size ? formatSize(source.Size) : undefined,
        bitrate: source.Bitrate ? formatBitrate(source.Bitrate) : undefined,
        audio: streamsOf(source, MediaStreamType.Audio).map(stream => stream.DisplayTitle ?? stream.Codec?.toUpperCase() ?? '').filter(Boolean),
        subtitles: Array.from(new Set(
            streamsOf(source, MediaStreamType.Subtitle).map(stream => stream.DisplayTitle ?? stream.Language ?? '').filter(Boolean)
        ))
    };
};

/** The files behind a movie or episode. Empty for shows, which have no file of their own. */
export const getMediaInfo = (item: BaseItemDto | null | undefined): MediaVersionInfo[] => {
    const sources = item?.MediaSources ?? [];
    return sources.map(source => describe(source, sources.length > 1));
};

/** Netflix-style quality badges for the best version: "4K", "Dolby Vision", "5.1", "Atmos". */
export const getQualityBadges = (item: BaseItemDto | null | undefined) => {
    const source = item?.MediaSources?.[0];
    if (!source) return [];
    const badges: string[] = [];
    const video = streamsOf(source, MediaStreamType.Video)[0];
    const resolution = video && getResolution(video);
    if (resolution === '4K' || resolution === '1080p' || resolution === '720p') badges.push(resolution === '4K' ? '4K' : 'HD');
    const hdr = video && getHdr(video);
    if (hdr) badges.push(hdr);
    const audio = streamsOf(source, MediaStreamType.Audio);
    const channels = Math.max(0, ...audio.map(stream => stream.Channels ?? 0));
    if (channels >= 8) badges.push('7.1');
    else if (channels >= 6) badges.push('5.1');
    if (audio.some(stream => /atmos/i.test(`${stream.DisplayTitle ?? ''} ${stream.Profile ?? ''}`))) badges.push('Atmos');
    return badges;
};
