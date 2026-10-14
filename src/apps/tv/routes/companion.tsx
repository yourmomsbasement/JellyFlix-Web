import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import Home from '@mui/icons-material/Home';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import PlayArrow from '@mui/icons-material/PlayArrow';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import React, { type FC, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

import { useDynamicAccent } from 'apps/modern/features/appearance/api/useAppearance';
import { accentVars } from 'apps/modern/features/appearance/components/AccentScope';
import { useCompanion } from 'apps/modern/features/companion/api/useCompanion';
import { getBackdropUrl, getStillUrl } from 'apps/modern/features/home/utils/images';
import { openItem, playItem } from 'apps/modern/features/home/utils/items';
import { useSimilar } from 'apps/modern/features/recommendations/api/useRecommendations';
import { useTitle } from 'apps/modern/features/title/api/useTitle';
import { clearBackdrop } from 'components/backdrop/backdrop';
import Page from 'components/Page';
import { appRouter } from 'components/router/appRouter';
import { useApi } from 'hooks/useApi';
import globalize from 'lib/globalize';

import TvBillboard from '../components/TvBillboard';
import TvPosterTile, { onPlayKey } from '../components/TvPosterTile';
import TvRow from '../components/TvRow';
import { useTvNavigation } from '../navigation/useTvNavigation';
import { BACKGROUND, CONTENT_LEFT, focusRingSx } from '../styles';
import { Pill, stageOffset } from './title';

const ExtraTile: FC<{ extra: BaseItemDto, fallback: string | undefined }> = ({ extra, fallback }) => {
    const { api } = useApi();
    const still = getStillUrl(api, extra, 640) ?? fallback;
    return (
        <Box
            component='button'
            type='button'
            data-tv-item
            onClick={() => playItem(extra)}
            onKeyDown={onPlayKey(extra)}
            sx={{
                flex: '0 0 auto',
                width: '24vw',
                p: 0,
                border: 0,
                background: 'none',
                color: '#fff',
                fontFamily: 'inherit',
                textAlign: 'left',
                cursor: 'pointer',
                outline: 'none',
                '&:focus .tvExtra-still': { outlineColor: '#fff', transform: 'scale(1.04)' }
            }}
        >
            <Box
                className='tvExtra-still'
                sx={{
                    ...focusRingSx,
                    height: '13.5vw',
                    mb: '0.7vw',
                    borderRadius: '0.35vw',
                    backgroundColor: '#2a2a2a',
                    backgroundImage: still ? `url("${still}")` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}
            />
            <Box sx={{ fontSize: '1.2vw', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{extra.Name}</Box>
            {extra.ExtraType && <Box sx={{ color: '#bcbcbc', fontSize: '1vw' }}>{globalize.translate(extra.ExtraType)}</Box>}
        </Box>
    );
};

/** The end-credit companion for the remote: the next film first, then extras, the soundtrack and more like it. */
const TvCompanion: FC = () => {
    const rootRef = useRef<HTMLDivElement>(null);
    const [ searchParams ] = useSearchParams();
    const itemId = searchParams.get('id') ?? undefined;
    const { api } = useApi();
    const { data: item, isPending } = useTitle(itemId);
    const { data: companion } = useCompanion(itemId);
    const { data: similar } = useSimilar(itemId);
    const next = companion?.NextInCollection ?? undefined;
    const accent = useDynamicAccent(next ?? item);

    useTvNavigation(rootRef, { memoryKey: itemId && `companion:${itemId}`, stageOffset });

    useEffect(() => {
        clearBackdrop();
    }, []);

    const backdrop = item ? getBackdropUrl(api, item, 640) : undefined;
    let eyebrow = item ? globalize.translate('YouFinishedTitle', item.Name ?? '') : '';
    if (next) eyebrow = companion?.CollectionName ? globalize.translate('NextInCollection', companion.CollectionName) : globalize.translate('UpNextInSeries');

    return (
        <Page id='tvCompanionPage' className='mainAnimatedPage' isBackButtonEnabled>
            <Box ref={rootRef} sx={{ position: 'fixed', inset: 0, zIndex: 10, overflow: 'hidden', backgroundColor: BACKGROUND, color: '#fff', ...(accent && accentVars(accent)) }}>
                {/* A soft glow of the title's color behind the rows */}
                {accent && <Box aria-hidden sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(70% 50% at 30% 85%, rgb(var(--jf-accent-channel) / 0.22), transparent 70%)' }} />}
                {isPending && <CircularProgress sx={{ position: 'absolute', top: '50%', left: '50%' }} />}

                {item && (
                    <Box data-tv-stage sx={{ position: 'relative', transition: 'transform 0.35s ease-out' }}>
                        <TvBillboard item={next ?? item} height='46vw' overviewLines={3} eyebrow={eyebrow}>
                            <Box data-tv-row data-tv-static sx={{ display: 'flex', flexWrap: 'wrap', gap: '1vw', mt: '2vw' }}>
                                {next ? (
                                    <>
                                        <Pill icon={<PlayArrow />} label={globalize.translate('Play')} isDefault onSelect={() => playItem(next)} />
                                        <Pill icon={<InfoOutlined />} label={globalize.translate('MoreInfo')} onSelect={() => openItem(next)} />
                                    </>
                                ) : (
                                    <Pill icon={<InfoOutlined />} label={globalize.translate('MoreInfo')} isDefault onSelect={() => openItem(item)} />
                                )}
                                <Pill icon={<Home />} label={globalize.translate('Home')} onSelect={appRouter.goHome.bind(appRouter)} />
                            </Box>
                        </TvBillboard>

                        <Box sx={{ position: 'relative', zIndex: 1, ml: CONTENT_LEFT, mr: '3vw', mt: '4vw', pb: '30vw' }}>
                            {!!companion?.Extras.length && (
                                <TvRow title={globalize.translate('Extras')}>
                                    {companion.Extras.map(extra => <ExtraTile key={extra.Id} extra={extra} fallback={backdrop} />)}
                                </TvRow>
                            )}
                            {!!companion?.Soundtracks.length && (
                                <TvRow title={companion.Composers.length ? globalize.translate('SoundtrackMusicBy', companion.Composers.join(', ')) : globalize.translate('Soundtrack')}>
                                    {companion.Soundtracks.map(album => <TvPosterTile key={album.Id} item={album} onSelect={appRouter.showItem.bind(appRouter)} />)}
                                </TvRow>
                            )}
                            {!!similar?.Items.length && (
                                <TvRow title={globalize.translate('HeaderMoreLikeThis')}>
                                    {similar.Items.map(similarItem => <TvPosterTile key={similarItem.Id} item={similarItem} />)}
                                </TvRow>
                            )}
                        </Box>
                    </Box>
                )}
            </Box>
        </Page>
    );
};

/** Another title's companion can open on the same route; start that one afresh. */
const TvCompanionPage: FC = () => {
    const [ searchParams ] = useSearchParams();
    return <TvCompanion key={searchParams.get('id')} />;
};

export default TvCompanionPage;
