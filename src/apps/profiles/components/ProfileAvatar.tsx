import Box from '@mui/material/Box';
import React, { type FC } from 'react';

import { useApi } from 'hooks/useApi';
import globalize from 'lib/globalize';

import { getProfileImageUrl, type Profile } from '../api/profiles';

interface ProfileAvatarProps {
    profile: Pick<Profile, 'Id' | 'Name' | 'AvatarColor' | 'PrimaryImageTag' | 'IsKids'>
    size?: string | number
}

/** A square profile avatar: the user's image if it has one, otherwise a smiley on the profile color. */
const ProfileAvatar: FC<ProfileAvatarProps> = ({ profile, size = '100%' }) => {
    const { api } = useApi();
    const imageUrl = getProfileImageUrl(api, profile as Profile);

    return (
        <Box
            sx={{
                position: 'relative',
                width: size,
                aspectRatio: '1',
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
                    <rect x='28' y='30' width='9' height='16' rx='2' fill='#fff' />
                    <rect x='63' y='30' width='9' height='16' rx='2' fill='#fff' />
                    <path d='M24 60 Q50 84 76 60' stroke='#fff' strokeWidth='7' fill='none' strokeLinecap='round' />
                </Box>
            )}
            {profile.IsKids && (
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
