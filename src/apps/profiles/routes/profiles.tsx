import Add from '@mui/icons-material/Add';
import Edit from '@mui/icons-material/Edit';
import Lock from '@mui/icons-material/Lock';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import React, { type FC, type ReactNode, useCallback, useEffect, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';

import layoutManager from 'components/layoutManager';
import { useApi } from 'hooks/useApi';
import globalize from 'lib/globalize';

import {
    getProfileErrorCode,
    isPluginMissing,
    type Profile,
    switchToProfile,
    useHousehold
} from '../api/profiles';
import PinDialog from '../components/PinDialog';
import ProfileAvatar from '../components/ProfileAvatar';
import ProfileEditor from '../components/ProfileEditor';
import { getReturnTarget } from '../startup';

const TILE_SIZE = 'clamp(84px, 10vw, 180px)';

const tileSx = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 1.5,
    width: TILE_SIZE,
    color: '#808080',
    '& .profileTile-avatar': {
        outline: '3px solid transparent',
        borderRadius: '6px',
        transition: 'outline-color 0.15s'
    },
    '&:hover, &:focus, &.Mui-focusVisible': {
        color: '#e5e5e5',
        '& .profileTile-avatar': { outlineColor: '#e5e5e5' }
    }
} as const;

interface TileProps {
    label: string
    hasInitialFocus?: boolean
    onClick: () => void
    children: ReactNode
    footer?: ReactNode
}

const Tile: FC<TileProps> = ({ label, hasInitialFocus, onClick, children, footer }) => {
    // Focused once, when the tile appears
    const focusOnMount = useCallback((button: HTMLButtonElement | null) => {
        if (hasInitialFocus) button?.focus();
    }, [ hasInitialFocus ]);

    return (
        <Box component='li' sx={{ listStyle: 'none' }}>
            <ButtonBase ref={focusOnMount} onClick={onClick} sx={tileSx} focusRipple>
                <Box className='profileTile-avatar' sx={{ position: 'relative', width: '100%' }}>
                    {children}
                </Box>
                <Typography component='span' sx={{ fontSize: 'clamp(0.9rem, 1.3vw, 1.3rem)', color: 'inherit', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {label}
                </Typography>
                {footer}
            </ButtonBase>
        </Box>
    );
};

const getPinError = (error: unknown) => {
    switch (getProfileErrorCode(error)) {
        case 'InvalidPin':
            return globalize.translate('IncorrectProfilePin');
        case 'PinLocked':
            return globalize.translate('ProfilePinLocked');
        default:
            return globalize.translate('ErrorDefault');
    }
};

/** "Who's watching?" — pick a profile, or manage the household's profiles. */
export const Component: FC = () => {
    const { api } = useApi();
    const [ searchParams, setSearchParams ] = useSearchParams();
    const isManaging = searchParams.get('manage') === 'true';
    // Asked automatically, right after sign in or when the app starts, rather than from "Switch profile"
    const isAutomatic = [ 'login', 'start' ].includes(searchParams.get('from') ?? '');
    const target = getReturnTarget(searchParams.get('return'));
    const navigate = useNavigate();

    const { data: household, error, isPending } = useHousehold();

    const [ pinProfile, setPinProfile ] = useState<Profile>();
    const [ pinError, setPinError ] = useState<string>();
    const [ switchError, setSwitchError ] = useState<string>();
    const [ isSwitching, setIsSwitching ] = useState(false);
    const [ editing, setEditing ] = useState<{ profile?: Profile }>();

    useEffect(() => {
        document.title = globalize.translate('WhoIsWatching');
    }, []);

    const doSwitch = useCallback((profile: Profile, pin?: string) => {
        if (!api) return;
        setIsSwitching(true);
        switchToProfile(api, profile.Id, pin, target).catch(err => {
            setIsSwitching(false);
            if (pin !== undefined) {
                setPinError(getPinError(err));
            } else {
                setSwitchError(globalize.translate('ErrorDefault'));
            }
        });
    }, [ api, target ]);

    const onProfileClick = useCallback((profile: Profile) => {
        if (isManaging) {
            setEditing({ profile });
        } else if (profile.Id === household?.CurrentProfileId) {
            // Already signed in as this profile; nothing to switch.
            navigate(target, { replace: isAutomatic });
        } else if (profile.HasPin) {
            setPinError(undefined);
            setPinProfile(profile);
        } else {
            doSwitch(profile);
        }
    }, [ isManaging, household?.CurrentProfileId, doSwitch, navigate, target, isAutomatic ]);

    const setManaging = useCallback((manage: boolean) => {
        setSearchParams(params => {
            if (manage) params.set('manage', 'true');
            else params.delete('manage');
            return params;
        }, { replace: true });
    }, [ setSearchParams ]);

    // Without the server plugin there are no profiles: carry on to the app as before.
    if (error && isPluginMissing(error)) return <Navigate replace to={target} />;
    // When asked automatically, only ask "who's watching" when there is a choice to make.
    if (isAutomatic && household && household.Profiles.length <= 1) return <Navigate replace to={target} />;

    const canEdit = (profile: Profile) => household?.CanManage || profile.Id === household?.CurrentProfileId;
    const showKidsPinWarning = isManaging && household?.CanManage
        && household.Profiles.some(p => p.IsKids)
        && household.Profiles.some(p => p.IsOwner && !p.HasPin);

    return (
        <Box
            sx={{
                position: 'fixed',
                inset: 0,
                zIndex: 1200,
                overflowY: 'auto',
                backgroundColor: '#141414',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                px: 2,
                py: 6,
                textAlign: 'center'
            }}
        >
            {(isPending || isSwitching) && <CircularProgress sx={{ color: '#e50914' }} />}

            {error && !isPluginMissing(error) && (
                <Alert severity='error'>{globalize.translate('ErrorDefault')}</Alert>
            )}

            {household && !isSwitching && (
                <>
                    <Typography
                        component='h1'
                        sx={{ color: '#fff', fontSize: 'clamp(1.75rem, 3.5vw, 3.5rem)', fontWeight: 500, mb: 'clamp(1rem, 2vw, 2rem)' }}
                    >
                        {globalize.translate(isManaging ? 'ManageProfiles' : 'WhoIsWatching')}
                    </Typography>

                    <Box
                        component='ul'
                        sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 'clamp(1rem, 2vw, 2rem)', p: 0, m: 0, mb: 6 }}
                    >
                        {household.Profiles.map(profile => (
                            <Tile
                                key={profile.Id}
                                label={profile.Name}
                                // On TVs the remote starts on the profile that watched last, like Netflix
                                hasInitialFocus={layoutManager.tv && !isManaging && profile.Id === household.CurrentProfileId}
                                onClick={() => onProfileClick(profile)}
                                footer={!isManaging && profile.HasPin && profile.Id !== household.CurrentProfileId && (
                                    <Lock fontSize='small' aria-label={globalize.translate('ProfileLocked')} />
                                )}
                            >
                                <ProfileAvatar profile={profile} />
                                {isManaging && canEdit(profile) && (
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            inset: 0,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderRadius: '6px',
                                            backgroundColor: 'rgba(0, 0, 0, 0.55)',
                                            color: '#fff'
                                        }}
                                    >
                                        <Edit sx={{ fontSize: '2.5em', border: '2px solid', borderRadius: '50%', p: 0.75 }} />
                                    </Box>
                                )}
                            </Tile>
                        ))}

                        {isManaging && household.CanManage && household.Profiles.length < household.MaxProfiles && (
                            <Tile label={globalize.translate('AddProfile')} onClick={() => setEditing({})}>
                                <Box sx={{ aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Add sx={{ fontSize: '4em', color: 'inherit', backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: '50%', p: 1 }} />
                                </Box>
                            </Tile>
                        )}
                    </Box>

                    {showKidsPinWarning && (
                        <Alert severity='info' sx={{ mb: 4, maxWidth: 560, textAlign: 'left' }}>
                            {globalize.translate('KidsProfilePinWarning')}
                        </Alert>
                    )}
                    {switchError && <Alert severity='error' sx={{ mb: 4 }}>{switchError}</Alert>}

                    {isManaging ? (
                        <Button
                            variant='contained'
                            onClick={() => setManaging(false)}
                            sx={{ backgroundColor: '#fff', color: '#141414', fontWeight: 700, px: 4, '&:hover': { backgroundColor: '#e50914', color: '#fff' } }}
                        >
                            {globalize.translate('Done')}
                        </Button>
                    ) : (
                        <Button
                            variant='outlined'
                            onClick={() => setManaging(true)}
                            sx={{ color: '#808080', borderColor: '#808080', letterSpacing: '0.15em', px: 3, '&:hover': { color: '#fff', borderColor: '#fff', backgroundColor: 'transparent' } }}
                        >
                            {globalize.translate('ManageProfiles')}
                        </Button>
                    )}

                    <ProfileEditor
                        open={!!editing}
                        household={household}
                        profile={editing?.profile}
                        onClose={() => setEditing(undefined)}
                    />
                </>
            )}

            <PinDialog
                profile={pinProfile}
                error={pinError}
                isSubmitting={isSwitching}
                onSubmit={pin => pinProfile && doSwitch(pinProfile, pin)}
                onClose={() => setPinProfile(undefined)}
            />
        </Box>
    );
};

Component.displayName = 'ProfilesPage';
