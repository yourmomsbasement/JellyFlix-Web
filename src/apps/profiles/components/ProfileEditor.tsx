import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import React, { type FC, type FormEvent, useCallback, useEffect, useState } from 'react';

import globalize from 'lib/globalize';

import {
    AVATAR_COLORS,
    getProfileErrorCode,
    type Household,
    type Profile,
    type ProfileInput,
    useCreateProfile,
    useDeleteProfile,
    useUpdateProfile
} from '../api/profiles';
import ProfileAvatar from './ProfileAvatar';

const MAX_NAME_LENGTH = 32;

interface ProfileEditorProps {
    open: boolean
    household: Household
    /** The profile to edit, or undefined to add a new one. */
    profile?: Profile
    onClose: () => void
}

const getErrorMessage = (error: unknown) => {
    switch (getProfileErrorCode(error)) {
        case 'ProfileLimitReached':
            return globalize.translate('ProfileLimitReached');
        case 'Forbidden':
            return globalize.translate('ProfileNotAllowed');
        default:
            return globalize.translate('ErrorDefault');
    }
};

const ProfileEditor: FC<ProfileEditorProps> = ({ open, household, profile, onClose }) => {
    const isNew = !profile;
    const canManage = household.CanManage;

    const [ name, setName ] = useState('');
    const [ color, setColor ] = useState(AVATAR_COLORS[0]);
    const [ isKids, setIsKids ] = useState(false);
    const [ pin, setPin ] = useState('');
    const [ removePin, setRemovePin ] = useState(false);
    const [ confirmDelete, setConfirmDelete ] = useState(false);

    const createProfile = useCreateProfile();
    const updateProfile = useUpdateProfile();
    const deleteProfile = useDeleteProfile();
    const { reset: resetCreate } = createProfile;
    const { reset: resetUpdate } = updateProfile;
    const { reset: resetDelete } = deleteProfile;
    const error = createProfile.error ?? updateProfile.error ?? deleteProfile.error;
    const isBusy = createProfile.isPending || updateProfile.isPending || deleteProfile.isPending;

    useEffect(() => {
        if (!open) return;
        setName(profile?.Name ?? '');
        setColor(profile?.AvatarColor ?? AVATAR_COLORS[household.Profiles.length % AVATAR_COLORS.length]);
        setIsKids(profile?.IsKids ?? false);
        setPin('');
        setRemovePin(false);
        setConfirmDelete(false);
        resetCreate();
        resetUpdate();
        resetDelete();
    }, [ open, profile, household.Profiles.length, resetCreate, resetUpdate, resetDelete ]);

    const isPinValid = pin === '' || /^\d{4}$/.test(pin);
    const trimmedName = name.trim();

    const onSubmit = useCallback((e: FormEvent) => {
        e.preventDefault();
        if (!trimmedName || !isPinValid) return;

        const input: ProfileInput = { Name: trimmedName, AvatarColor: color };
        if (canManage && !profile?.IsOwner) input.IsKids = isKids;
        if (pin) input.Pin = pin;
        else if (removePin) input.RemovePin = true;

        const options = { onSuccess: onClose };
        if (profile) {
            updateProfile.mutate({ id: profile.Id, input }, options);
        } else {
            createProfile.mutate(input, options);
        }
    }, [ trimmedName, isPinValid, color, canManage, profile, isKids, pin, removePin, onClose, updateProfile, createProfile ]);

    const onDelete = useCallback(() => {
        if (!profile) return;
        if (!confirmDelete) {
            setConfirmDelete(true);
            return;
        }
        deleteProfile.mutate(profile.Id, { onSuccess: onClose });
    }, [ profile, confirmDelete, deleteProfile, onClose ]);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth='sm'
            slotProps={{ paper: { component: 'form', onSubmit, sx: { backgroundColor: '#141414', backgroundImage: 'none' } } }}
        >
            <DialogTitle>
                {globalize.translate(isNew ? 'AddProfile' : 'EditProfile')}
            </DialogTitle>
            <DialogContent>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ pt: 1 }}>
                    <Box sx={{ width: 120, flexShrink: 0, alignSelf: { xs: 'center', sm: 'flex-start' } }}>
                        <ProfileAvatar profile={{ Id: profile?.Id ?? '', Name: name, AvatarColor: color, PrimaryImageTag: profile?.PrimaryImageTag, IsKids: isKids }} />
                    </Box>

                    <Stack spacing={2.5} sx={{ flex: 1 }}>
                        <TextField
                            label={globalize.translate('Name')}
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                            slotProps={{ htmlInput: { maxLength: MAX_NAME_LENGTH } }}
                        />

                        <Box>
                            <Typography variant='body2' sx={{ mb: 1, color: 'text.secondary' }}>
                                {globalize.translate('ProfileColor')}
                            </Typography>
                            <Stack direction='row' spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                                {AVATAR_COLORS.map(c => (
                                    <ButtonBase
                                        key={c}
                                        onClick={() => setColor(c)}
                                        aria-label={c}
                                        aria-pressed={c === color}
                                        sx={{
                                            width: 36,
                                            height: 36,
                                            borderRadius: '4px',
                                            backgroundColor: c,
                                            outline: c === color ? '3px solid #fff' : 'none',
                                            outlineOffset: '2px'
                                        }}
                                    />
                                ))}
                            </Stack>
                        </Box>

                        {canManage && !profile?.IsOwner && (
                            <FormControlLabel
                                control={<Switch checked={isKids} onChange={e => setIsKids(e.target.checked)} />}
                                label={
                                    <>
                                        <Typography>{globalize.translate('KidsProfile')}</Typography>
                                        <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                                            {globalize.translate('KidsProfileHelp')}
                                        </Typography>
                                    </>
                                }
                            />
                        )}

                        <Box>
                            <TextField
                                label={globalize.translate(profile?.HasPin ? 'ProfileNewPin' : 'ProfilePin')}
                                value={pin}
                                onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                error={!isPinValid}
                                helperText={globalize.translate('ProfilePinHelp')}
                                disabled={removePin}
                                fullWidth
                                slotProps={{ htmlInput: { inputMode: 'numeric', autoComplete: 'off', maxLength: 4 } }}
                            />
                            {profile?.HasPin && (
                                <FormControlLabel
                                    control={<Switch checked={removePin} onChange={e => setRemovePin(e.target.checked)} />}
                                    label={globalize.translate('RemoveProfilePin')}
                                />
                            )}
                        </Box>

                        {error && <Alert severity='error'>{getErrorMessage(error)}</Alert>}
                        {confirmDelete && (
                            <Alert severity='warning'>{globalize.translate('DeleteProfileConfirm', profile?.Name)}</Alert>
                        )}
                    </Stack>
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                {canManage && profile && !profile.IsOwner && (
                    <Button color='error' onClick={onDelete} disabled={isBusy} sx={{ mr: 'auto' }}>
                        {globalize.translate(confirmDelete ? 'DeleteProfileConfirmButton' : 'DeleteProfile')}
                    </Button>
                )}
                <Button color='inherit' onClick={onClose} disabled={isBusy}>
                    {globalize.translate('ButtonCancel')}
                </Button>
                <Button type='submit' variant='contained' disabled={isBusy || !trimmedName || !isPinValid}>
                    {globalize.translate('Save')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ProfileEditor;
