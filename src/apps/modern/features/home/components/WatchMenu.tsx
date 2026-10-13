import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline';
import DoneAll from '@mui/icons-material/DoneAll';
import MoreVert from '@mui/icons-material/MoreVert';
import RemoveCircleOutline from '@mui/icons-material/RemoveCircleOutline';
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import React, { type FC, type ReactNode, useState } from 'react';

import globalize from 'lib/globalize';

import { useWatchActions, type WatchAction } from '../api/useWatchActions';

interface WatchMenuProps {
    item: BaseItemDto
    /** Which actions to offer; ones that don't apply to the item (e.g. "show" actions on a movie) are skipped. */
    actions: WatchAction[]
}

const OPTIONS: Record<WatchAction, { icon: ReactNode, label: string, applies: (item: BaseItemDto) => boolean }> = {
    markWatched: {
        icon: <CheckCircleOutline fontSize='small' />,
        label: 'MarkAsWatched',
        applies: () => true
    },
    markShowWatched: {
        icon: <DoneAll fontSize='small' />,
        label: 'MarkShowAsWatched',
        applies: item => !!item.SeriesId
    },
    removeFromContinueWatching: {
        icon: <RemoveCircleOutline fontSize='small' />,
        label: 'RemoveFromContinueWatching',
        applies: item => (item.UserData?.PlaybackPositionTicks ?? 0) > 0
    }
};

/** The "⋮" menu on Continue Watching and Next Up tiles. */
const WatchMenu: FC<WatchMenuProps> = ({ item, actions }) => {
    const [ anchor, setAnchor ] = useState<HTMLElement | null>(null);
    const watchActions = useWatchActions();
    const available = actions.filter(action => OPTIONS[action].applies(item));

    if (!available.length) return null;

    return (
        <>
            <IconButton
                className='mediaCard-menu'
                size='small'
                aria-label={globalize.translate('ButtonMore')}
                aria-haspopup='true'
                onClick={e => setAnchor(e.currentTarget)}
                sx={{
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    zIndex: 3,
                    color: '#fff',
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.5)',
                    transition: 'opacity 0.3s ease 0.1s',
                    '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.85)', borderColor: '#fff' },
                    // With a mouse it appears on hover like the other tile controls; touch screens always show it
                    '@media (hover: hover)': { opacity: anchor ? 1 : 0 },
                    '&.Mui-focusVisible': { opacity: 1 }
                }}
            >
                <MoreVert fontSize='small' />
            </IconButton>
            <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)}>
                {available.map(action => (
                    <MenuItem
                        key={action}
                        disabled={watchActions.isPending}
                        onClick={() => {
                            setAnchor(null);
                            watchActions.mutate({ action, item });
                        }}
                    >
                        <ListItemIcon>{OPTIONS[action].icon}</ListItemIcon>
                        <ListItemText>{globalize.translate(OPTIONS[action].label)}</ListItemText>
                    </MenuItem>
                ))}
            </Menu>
        </>
    );
};

export default WatchMenu;
