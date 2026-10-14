import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import Folder from '@mui/icons-material/Folder';
import Home from '@mui/icons-material/Home';
import LiveTv from '@mui/icons-material/LiveTv';
import Movie from '@mui/icons-material/Movie';
import MusicNote from '@mui/icons-material/MusicNote';
import Search from '@mui/icons-material/Search';
import Settings from '@mui/icons-material/Settings';
import Tv from '@mui/icons-material/Tv';
import Box from '@mui/material/Box';
import React, { type FC, type ReactNode } from 'react';

import { useHousehold } from 'apps/profiles/api/profiles';
import ProfileAvatar from 'apps/profiles/components/ProfileAvatar';
import { appRouter } from 'components/router/appRouter';
import { useUserViews } from 'hooks/api/useUserViews';
import globalize from 'lib/globalize';

import { BACKGROUND, RAIL_WIDTH } from '../styles';

const EXPANDED_WIDTH = '19vw';

const go = (path: string) => {
    void appRouter.show(path);
};

const getLibraryIcon = (view: BaseItemDto) => {
    switch (view.CollectionType) {
        case CollectionType.Movies:
            return <Movie />;
        case CollectionType.Tvshows:
            return <Tv />;
        case CollectionType.Music:
            return <MusicNote />;
        case CollectionType.Livetv:
            return <LiveTv />;
        default:
            return <Folder />;
    }
};

interface RailItemProps {
    icon: ReactNode
    label: string
    isCurrent?: boolean
    onSelect: () => void
}

const RailItem: FC<RailItemProps> = ({ icon, label, isCurrent, onSelect }) => (
    <Box
        component='button'
        type='button'
        data-tv-item
        data-tv-current={isCurrent || undefined}
        onClick={onSelect}
        sx={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.2vw',
            width: '100%',
            height: '3.6vw',
            px: '1.55vw',
            border: 0,
            borderRadius: '0.3vw',
            backgroundColor: 'transparent',
            color: isCurrent ? '#fff' : '#8c8c8c',
            fontFamily: 'inherit',
            fontSize: '1.35vw',
            fontWeight: isCurrent ? 700 : 500,
            textAlign: 'left',
            whiteSpace: 'nowrap',
            cursor: 'pointer',
            outline: 'none',
            '& svg': { flex: '0 0 auto', fontSize: '2.2vw' },
            '&:focus': { color: '#fff', backgroundColor: 'rgba(255, 255, 255, 0.12)' }
        }}
    >
        {icon}
        <Box component='span' className='tvRail-label' sx={{ opacity: 0, transition: 'opacity 0.2s' }}>{label}</Box>
    </Box>
);

interface TvRailProps {
    current?: 'home'
}

/**
 * Netflix's TV side menu: icons down the left edge that open into labels while the menu has focus.
 * Left from the first tile of a row opens it.
 */
const TvRail: FC<TvRailProps> = ({ current }) => {
    const { data: household } = useHousehold();
    const { data: views } = useUserViews();
    const profile = household?.Profiles.find(p => p.Id === household.CurrentProfileId);

    return (
        <Box
            component='nav'
            data-tv-rail
            aria-label={globalize.translate('Menu')}
            sx={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: 0,
                zIndex: 3,
                width: RAIL_WIDTH,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: '0.6vw',
                overflow: 'hidden',
                background: `linear-gradient(to right, ${BACKGROUND} 60%, transparent)`,
                transition: 'width 0.25s ease-out, background 0.25s',
                '&:focus-within': {
                    width: EXPANDED_WIDTH,
                    background: `linear-gradient(to right, ${BACKGROUND} 75%, rgb(var(--jf-palette-background-defaultChannel) / 0.85))`,
                    boxShadow: '2vw 0 4vw rgba(0, 0, 0, 0.8)',
                    '& .tvRail-label': { opacity: 1 }
                }
            }}
        >
            {household && profile && (
                <RailItem
                    icon={<Box sx={{ width: '2.2vw' }}><ProfileAvatar profile={profile} size='2.2vw' hideKidsBadge /></Box>}
                    label={household.Profiles.length > 1 ? globalize.translate('SwitchProfile') : profile.Name}
                    onSelect={() => go('/profiles')}
                />
            )}
            <RailItem icon={<Search />} label={globalize.translate('Search')} onSelect={() => go('/search')} />
            <RailItem icon={<Home />} label={globalize.translate('Home')} isCurrent={current === 'home'} onSelect={() => go('/home')} />
            {views?.Items?.map(view => (
                <RailItem key={view.Id} icon={getLibraryIcon(view)} label={view.Name ?? ''} onSelect={() => appRouter.showItem(view)} />
            ))}
            <RailItem icon={<Settings />} label={globalize.translate('Settings')} onSelect={() => go('/mypreferencesmenu')} />
        </Box>
    );
};

export default TvRail;
