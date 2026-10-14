import Box from '@mui/material/Box';
import React, { type FC } from 'react';

import { useApi } from 'hooks/useApi';
import globalize from 'lib/globalize';

import { getProfileImageUrl, type Profile } from '../api/profiles';
import { getAvatarIcon } from './avatarIcons';

interface ProfileAvatarProps {
    profile: Pick<Profile, 'Id' | 'Name' | 'AvatarColor' | 'AvatarIcon' | 'PrimaryImageTag' | 'IsKids'>
    size?: string | number
    /** Hide the KIDS ribbon, e.g. on small avatars where it wouldn't fit. */
    hideKidsBadge?: boolean
    /** A photo to show instead of the saved one, e.g. one picked but not uploaded yet; null shows none. */
    imageUrl?: string | null
}

/** A square profile avatar: the profile's photo if it has one, otherwise its generated icon on the profile color. */
const ProfileAvatar: FC<ProfileAvatarProps> = ({ profile, size = '100%', hideKidsBadge = false, imageUrl: imageOverride }) => {
    const { api } = useApi();
    const imageUrl = imageOverride === undefined ? getProfileImageUrl(api, profile as Profile) : imageOverride;

    return (
        <Box
            sx={{
                position: 'relative',
                width: size,
                // Square without `aspect-ratio`, which older TV browsers lack
                '&::before': { content: '""', display: 'block', paddingTop: '100%' },
                borderRadius: '6px',
                overflow: 'hidden',
                backgroundColor: profile.AvatarColor,
                backgroundImage: imageUrl ? `url("${imageUrl}")` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
            }}
        >
            {!imageUrl && (
                <Box
                    component='svg'
                    viewBox='0 0 100 100'
                    aria-hidden
                    sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
                >
                    {getAvatarIcon(profile.AvatarIcon).art}
                </Box>
            )}
            {profile.IsKids && !hideKidsBadge && (
                <Box
                    component='span'
                    sx={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        bottom: 0,
                        py: '4%',
                        textAlign: 'center',
                        fontWeight: 800,
                        fontSize: 'clamp(0.6rem, 1.2vw, 1rem)',
                        letterSpacing: '0.08em',
                        color: '#fff',
                        background: 'linear-gradient(90deg, #e50914, #f5c518, #2bb673, #0071eb)'
                    }}
                >
                    {globalize.translate('ProfileKidsBadge')}
                </Box>
            )}
        </Box>
    );
};

export default ProfileAvatar;
