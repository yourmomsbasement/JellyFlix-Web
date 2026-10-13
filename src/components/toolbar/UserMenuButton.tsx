import ArrowDropDown from '@mui/icons-material/ArrowDropDown';
import ButtonBase from '@mui/material/ButtonBase';
import Tooltip from '@mui/material/Tooltip';
import React, { useCallback, useState } from 'react';

import { useHousehold } from 'apps/profiles/api/profiles';
import ProfileAvatar from 'apps/profiles/components/ProfileAvatar';
import UserAvatar from 'components/UserAvatar';
import { useApi } from 'hooks/useApi';
import globalize from 'lib/globalize';

import AppUserMenu, { ID } from './AppUserMenu';

const UserMenuButton = () => {
    const { user } = useApi();
    const { data: household } = useHousehold();
    const currentProfile = household?.Profiles.find(p => p.Id === household.CurrentProfileId);

    const [ userMenuAnchorEl, setUserMenuAnchorEl ] = useState<null | HTMLElement>(null);
    const isUserMenuOpen = Boolean(userMenuAnchorEl);

    const onUserButtonClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
        setUserMenuAnchorEl(event.currentTarget);
    }, [ setUserMenuAnchorEl ]);

    const onUserMenuClose = useCallback(() => {
        setUserMenuAnchorEl(null);
    }, [ setUserMenuAnchorEl ]);

    return (
        <>
            <Tooltip title={globalize.translate('UserMenu')}>
                <ButtonBase
                    aria-label={globalize.translate('UserMenu')}
                    aria-controls={ID}
                    aria-haspopup='true'
                    onClick={onUserButtonClick}
                    sx={{
                        ml: 1,
                        gap: 0.25,
                        borderRadius: 1,
                        color: 'text.primary',
                        '& .userMenuButton-caret': { transition: 'transform 0.3s' },
                        '&[aria-expanded="true"] .userMenuButton-caret': { transform: 'rotate(180deg)' }
                    }}
                    aria-expanded={isUserMenuOpen}
                >
                    {/* With the profiles plugin, show the Netflix-style profile avatar */}
                    {currentProfile ? <ProfileAvatar profile={currentProfile} size='32px' hideKidsBadge /> : <UserAvatar user={user} />}
                    <ArrowDropDown className='userMenuButton-caret' />
                </ButtonBase>
            </Tooltip>

            <AppUserMenu
                open={isUserMenuOpen}
                anchorEl={userMenuAnchorEl}
                onMenuClose={onUserMenuClose}
            />
        </>
    );
};

export default UserMenuButton;
