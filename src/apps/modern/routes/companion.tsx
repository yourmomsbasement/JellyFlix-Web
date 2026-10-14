import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import MusicNote from '@mui/icons-material/MusicNote';
import PlayArrow from '@mui/icons-material/PlayArrow';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import React, { type FC, type ReactNode, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

import { useDynamicAccent } from 'apps/modern/features/appearance/api/useAppearance';
import AccentScope from 'apps/modern/features/appearance/components/AccentScope';
import { useArtworkOverrides } from 'apps/modern/features/artwork/api/useArtwork';
import { clearBackdrop } from 'components/backdrop/backdrop';
import Page from 'components/Page';
import { appRouter } from 'components/router/appRouter';
import { useApi } from 'hooks/useApi';
import globalize from 'lib/globalize';

import { useCompanion } from '../features/companion/api/useCompanion';
import MediaCard from '../features/home/components/MediaCard';
import { GUTTER } from '../features/home/components/MediaRow';
import { lightPillSx, pillSx } from '../features/home/styles';
import { getBackdropUrl, getLogoUrl, getPosterUrl, getStillUrl } from '../features/home/utils/images';
import { getMetaParts, openItem, playItem } from '../features/home/utils/items';
import { useSimilar } from '../features/recommendations/api/useRecommendations';
import { useTitle } from '../features/title/api/useTitle';

const SectionTitle: FC<{ children: ReactNode }> = ({ children }) => (
    <Typography component='h2' sx={{ mb: 2, fontSize: { xs: '1.3rem', md: '1.6rem' }, fontWeight: 700, color: '#fff' }}>
        {children}
    </Typography>
);

const tileSx = {
    display: 'block',
    width: '100%',
    textAlign: 'left',
    borderRadius: 1,
    '& .tile-art': { transition: 'transform 0.2s' },
    '&:hover .tile-art, &.Mui-focusVisible .tile-art': { transform: 'scale(1.04)' }
};

/** The next film in the collection, big, with Play. */
const NextInCollection: FC<{ item: BaseItemDto, collectionName: string | null }> = ({ item, collectionName }) => {
    const { api } = useApi();
    const backdrop = getBackdropUrl(api, item, 1280);
    const logo = getLogoUrl(api, item, 500);

    return (
        <Box
            component='section'
            sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '3fr 2fr' },
                borderRadius: 2,
                overflow: 'hidden',
                backgroundColor: '#1f1f1f',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                mb: 6
            }}
        >
            <Box sx={{ aspectRatio: '16 / 9', backgroundColor: '#2a2a2a', backgroundImage: backdrop ? `url("${backdrop}")` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }} />
            <Stack spacing={2} sx={{ p: { xs: 2.5, md: 4 }, justifyContent: 'center' }}>
                <Typography sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '0.8rem' }}>
                    {collectionName ? globalize.translate('NextInCollection', collectionName) : globalize.translate('UpNextInSeries')}
                </Typography>
                {logo ? (
                    <Box component='img' src={logo} alt={item.Name ?? ''} sx={{ maxWidth: '70%', maxHeight: 90, objectFit: 'contain', objectPosition: 'left' }} />
                ) : (
                    <Typography component='h2' sx={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff' }}>{item.Name}</Typography>
                )}
                <Typography sx={{ color: 'text.secondary' }}>{getMetaParts(item).join(' · ')}</Typography>
                {item.Overview && (
                    <Typography sx={{ color: '#ddd', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {item.Overview}
                    </Typography>
                )}
                <Stack direction='row' spacing={1.5}>
                    <Button startIcon={<PlayArrow />} onClick={() => playItem(item)} sx={pillSx}>{globalize.translate('Play')}</Button>
                    <Button startIcon={<InfoOutlined />} onClick={() => openItem(item)} sx={lightPillSx}>{globalize.translate('MoreInfo')}</Button>
                </Stack>
            </Stack>
        </Box>
    );
};

const ExtraTile: FC<{ extra: BaseItemDto, fallback: string | undefined }> = ({ extra, fallback }) => {
    const { api } = useApi();
    const still = getStillUrl(api, extra, 480) ?? fallback;
    return (
        <ButtonBase onClick={() => playItem(extra)} sx={tileSx} aria-label={extra.Name ?? ''}>
            <Box sx={{ aspectRatio: '16 / 9', borderRadius: 1, overflow: 'hidden', backgroundColor: '#2a2a2a', position: 'relative' }}>
                <Box
                    className='tile-art'
                    sx={{ position: 'absolute', inset: 0, backgroundImage: still ? `url("${still}")` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }}
                />
                <PlayArrow sx={{ position: 'absolute', left: 8, bottom: 8, color: '#fff', backgroundColor: 'rgba(0, 0, 0, 0.6)', borderRadius: '50%', p: 0.5 }} />
            </Box>
            <Typography sx={{ mt: 1, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{extra.Name}</Typography>
            {extra.ExtraType && <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>{globalize.translate(extra.ExtraType)}</Typography>}
        </ButtonBase>
    );
};

const AlbumTile: FC<{ album: BaseItemDto }> = ({ album }) => {
    const { api } = useApi();
    const cover = getPosterUrl(api, album, 300);
    return (
        <ButtonBase onClick={() => appRouter.showItem(album)} sx={tileSx} aria-label={album.Name ?? ''}>
            <Box sx={{ aspectRatio: '1', borderRadius: 1, overflow: 'hidden', backgroundColor: '#2a2a2a', display: 'grid', placeItems: 'center' }}>
                {cover ? <Box className='tile-art' component='img' src={cover} alt='' sx={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <MusicNote sx={{ fontSize: 48, color: '#666' }} />}
            </Box>
            <Typography sx={{ mt: 1, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{album.Name}</Typography>
            <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>{album.AlbumArtist}</Typography>
        </ButtonBase>
    );
};

/**
 * The end-credit companion: after a movie, the next film in its collection, extras, the soundtrack and more like it.
 */
const CompanionPage: FC = () => {
    const [ searchParams ] = useSearchParams();
    const itemId = searchParams.get('id') ?? undefined;
    const { api } = useApi();
    useArtworkOverrides();
    const { data: item, isPending } = useTitle(itemId);
    const { data: companion } = useCompanion(itemId);
    const { data: similar } = useSimilar(itemId);
    const accent = useDynamicAccent(companion?.NextInCollection ?? item);

    useEffect(() => {
        clearBackdrop();
    }, []);

    const backdrop = item ? getBackdropUrl(api, item) : undefined;
    const hasSoundtrack = !!companion && (companion.Composers.length > 0 || companion.Soundtracks.length > 0);

    return (
        <Page id='companionPage' className='mainAnimatedPage' isBackButtonEnabled>
            {isPending && <Box sx={{ display: 'flex', justifyContent: 'center', pt: '30vh' }}><CircularProgress /></Box>}
            {item && (
                <AccentScope accent={accent} sx={{ minHeight: '100vh' }}>
                    {/* The finished film, faded behind everything */}
                    <Box
                        aria-hidden
                        sx={{
                            position: 'absolute',
                            inset: '0 0 auto 0',
                            height: '70vh',
                            backgroundImage: backdrop ? `linear-gradient(to bottom, rgba(20, 20, 20, 0.55), #141414), url("${backdrop}")` : undefined,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center top'
                        }}
                    />
                    <Box sx={{ position: 'relative', px: GUTTER, pt: { xs: 10, md: 14 }, pb: 8 }}>
                        <Typography sx={{ color: 'text.secondary', fontWeight: 600 }}>{globalize.translate('YouFinished')}</Typography>
                        <Typography component='h1' sx={{ fontSize: { xs: '2rem', md: '3rem' }, fontWeight: 800, color: '#fff', mb: 4 }}>{item.Name}</Typography>

                        {companion?.NextInCollection && <NextInCollection item={companion.NextInCollection} collectionName={companion.CollectionName} />}

                        {!!companion?.Extras.length && (
                            <Box component='section' sx={{ mb: 6 }}>
                                <SectionTitle>{globalize.translate('Extras')}</SectionTitle>
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2 }}>
                                    {companion.Extras.map(extra => <ExtraTile key={extra.Id} extra={extra} fallback={backdrop} />)}
                                </Box>
                            </Box>
                        )}

                        {hasSoundtrack && (
                            <Box component='section' sx={{ mb: 6 }}>
                                <SectionTitle>{globalize.translate('Soundtrack')}</SectionTitle>
                                {companion.Composers.length > 0 && (
                                    <Typography sx={{ color: '#ddd', mb: 2 }}>{globalize.translate('MusicBy', companion.Composers.join(', '))}</Typography>
                                )}
                                {companion.Soundtracks.length > 0 && (
                                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(3, 1fr)', md: 'repeat(6, 1fr)' }, gap: 2 }}>
                                        {companion.Soundtracks.map(album => <AlbumTile key={album.Id} album={album} />)}
                                    </Box>
                                )}
                            </Box>
                        )}

                        {!!similar?.Items.length && (
                            <Box component='section' sx={{ mb: 6 }}>
                                <SectionTitle>{globalize.translate('HeaderMoreLikeThis')}</SectionTitle>
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(3, 1fr)', sm: 'repeat(4, 1fr)', md: 'repeat(6, 1fr)', lg: 'repeat(7, 1fr)' }, gap: 1.5 }}>
                                    {similar.Items.map(similarItem => <MediaCard key={similarItem.Id} item={similarItem} />)}
                                </Box>
                            </Box>
                        )}
                    </Box>
                </AccentScope>
            )}
        </Page>
    );
};

export default CompanionPage;
