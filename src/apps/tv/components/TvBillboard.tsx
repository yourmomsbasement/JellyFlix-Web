import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import Box from '@mui/material/Box';
import { keyframes } from '@mui/material/styles';
import React, { type FC, type ReactNode } from 'react';

import { MATCH_GREEN } from 'apps/modern/features/home/styles';
import { getBackdropUrl, getLogoUrl } from 'apps/modern/features/home/utils/images';
import { getDisplayTitle, getEpisodeLabel, getMetaParts } from 'apps/modern/features/home/utils/items';
import { useApi } from 'hooks/useApi';
import globalize from 'lib/globalize';

import { BACKGROUND, CONTENT_LEFT } from '../styles';

const fadeIn = keyframes`
    from { opacity: 0; }
    to { opacity: 1; }
`;

interface TvBillboardProps {
    item: BaseItemDto | undefined
    /** Height of the artwork, as a share of the screen width (16:9 is 56.25vw). */
    height?: string
    match?: number | null
    /** Lines of description to show. */
    overviewLines?: number
    children?: ReactNode
}

/**
 * The top of Netflix's TV screens: big artwork on the right fading into the page, with the title, its details and
 * description on the left. On Home it follows the focused tile.
 */
const TvBillboard: FC<TvBillboardProps> = ({ item, height = '40vw', match, overviewLines = 3, children }) => {
    const { api } = useApi();
    if (!item) return null;

    const backdropUrl = getBackdropUrl(api, item, 1280);
    const logoUrl = getLogoUrl(api, item, 600);
    const episode = getEpisodeLabel(item);
    const isEpisode = item.Type === BaseItemKind.Episode;
    const title = getDisplayTitle(item);
    const overview = item.Overview;

    return (
        <>
            {backdropUrl && (
                <Box
                    key={backdropUrl}
                    sx={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        width: '72vw',
                        height,
                        backgroundImage: `url("${backdropUrl}")`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center top',
                        animation: `${fadeIn} 0.5s ease-out`,
                        '&::after': {
                            content: '""',
                            position: 'absolute',
                            inset: 0,
                            background: `linear-gradient(to right, ${BACKGROUND} 0%, rgba(20, 20, 20, 0.6) 25%, transparent 55%),
                                linear-gradient(to top, ${BACKGROUND} 0%, transparent 40%)`
                        }
                    }}
                />
            )}

            <Box
                key={item.Id}
                sx={{
                    position: 'relative',
                    zIndex: 1,
                    ml: CONTENT_LEFT,
                    pt: '3.5vw',
                    width: '40vw',
                    animation: `${fadeIn} 0.35s ease-out`
                }}
            >
                {logoUrl ? (
                    <Box component='img' src={logoUrl} alt={title} sx={{ display: 'block', maxWidth: '28vw', maxHeight: '8vw', objectFit: 'contain', objectPosition: 'left bottom', mb: '1.2vw' }} />
                ) : (
                    <Box component='h1' sx={{ m: 0, mb: '1vw', color: '#fff', fontSize: '3.2vw', fontWeight: 800, lineHeight: 1.05 }}>{title}</Box>
                )}

                {isEpisode && (
                    <Box sx={{ mb: '0.5vw', color: '#fff', fontSize: '1.35vw', fontWeight: 600 }}>
                        {episode} {item.Name}
                    </Box>
                )}

                <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.9vw', mb: '0.9vw', color: '#bcbcbc', fontSize: '1.2vw' }}>
                    {match != null && (
                        <Box component='span' sx={{ color: MATCH_GREEN, fontWeight: 700 }}>{globalize.translate('MatchPercent', String(match))}</Box>
                    )}
                    {getMetaParts(item).map(part => (
                        <Box
                            component='span'
                            key={part}
                            sx={part === item.OfficialRating ? { px: '0.4vw', border: '0.08vw solid rgba(255, 255, 255, 0.5)', lineHeight: 1.3 } : undefined}
                        >
                            {part}
                        </Box>
                    ))}
                </Box>

                {overview && (
                    <Box
                        sx={{
                            color: '#e5e5e5',
                            fontSize: '1.2vw',
                            lineHeight: 1.45,
                            display: '-webkit-box',
                            WebkitLineClamp: overviewLines,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                        }}
                    >
                        {overview}
                    </Box>
                )}

                {!!item.Genres?.length && (
                    <Box sx={{ mt: '0.8vw', color: '#bcbcbc', fontSize: '1.05vw' }}>{item.Genres.slice(0, 3).join(' • ')}</Box>
                )}

                {children}
            </Box>
        </>
    );
};

export default TvBillboard;
