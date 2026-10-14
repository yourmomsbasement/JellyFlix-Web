import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import React, { type FC, type ReactNode } from 'react';

import globalize from 'lib/globalize';

import type { MediaVersionInfo } from '../utils/mediaInfo';

const Row: FC<{ label: string, children: ReactNode }> = ({ label, children }) => (
    <Box component='tr' sx={{ verticalAlign: 'top' }}>
        <Box component='th' scope='row' sx={{ pr: 3, pb: 1, color: '#777', fontWeight: 400, textAlign: 'left', whiteSpace: 'nowrap' }}>{label}</Box>
        <Box component='td' sx={{ pb: 1, color: '#fff' }}>{children}</Box>
    </Box>
);

const Lines: FC<{ lines: string[] }> = ({ lines }) => (
    <>{lines.map(line => <Box key={line}>{line}</Box>)}</>
);

interface MediaInfoSectionProps {
    versions: MediaVersionInfo[]
    /** Which episode the details are for, on a show's page (e.g. "S1:E3"). */
    episodeLabel?: string
}

/** The file behind a title: container, video, audio and subtitle tracks, size and bitrate. */
const MediaInfoSection: FC<MediaInfoSectionProps> = ({ versions, episodeLabel }) => {
    if (!versions.length) return null;

    return (
        <Box component='section' sx={{ mt: 4 }}>
            <Typography component='h2' sx={{ mb: 2, fontSize: { xs: '1.3rem', md: '1.6rem' }, fontWeight: 700, color: '#fff' }}>
                {episodeLabel ? globalize.translate('VideoAndAudioFor', episodeLabel) : globalize.translate('VideoAndAudio')}
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(auto-fill, minmax(420px, 1fr))' }, gap: 4 }}>
                {versions.map((version, index) => (
                    <Box key={version.name ?? index}>
                        {version.name && (
                            <Typography sx={{ mb: 1, color: '#fff', fontWeight: 700 }}>{version.name}</Typography>
                        )}
                        <Box component='table' sx={{ borderCollapse: 'collapse', fontSize: '0.95rem', lineHeight: 1.5 }}>
                            <tbody>
                                {version.container && <Row label={globalize.translate('MediaInfoContainer')}>{version.container}</Row>}
                                {(version.resolution || version.videoCodec) && (
                                    <Row label={globalize.translate('Video')}>
                                        {[ version.resolution, version.videoCodec ].filter(Boolean).join(' · ')}
                                    </Row>
                                )}
                                {version.hdr && <Row label={globalize.translate('DynamicRange')}>{version.hdr}</Row>}
                                {version.audio.length > 0 && <Row label={globalize.translate('Audio')}><Lines lines={version.audio} /></Row>}
                                {version.subtitles.length > 0 && <Row label={globalize.translate('Subtitles')}>{version.subtitles.join(', ')}</Row>}
                                {version.size && <Row label={globalize.translate('MediaInfoSize')}>{version.size}</Row>}
                                {version.bitrate && <Row label={globalize.translate('MediaInfoBitrate')}>{version.bitrate}</Row>}
                            </tbody>
                        </Box>
                    </Box>
                ))}
            </Box>
        </Box>
    );
};

export default MediaInfoSection;
