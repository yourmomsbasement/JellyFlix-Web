import AddAPhoto from '@mui/icons-material/AddAPhoto';
import Casino from '@mui/icons-material/Casino';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
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
import { isAxiosError } from 'axios';
import React, { type ChangeEvent, type FC, type FormEvent, useCallback, useEffect, useState } from 'react';

import globalize from 'lib/globalize';

import {
    AVATAR_COLORS,
    getProfileErrorCode,
    type Household,
    type Profile,
    type ProfileInput,
    useCreateProfile,
    useDeleteProfile,
    useRemoveProfileImage,
    useSetProfileImage,
    useUpdateProfile
} from '../api/profiles';
import { toSquarePhoto } from '../utils/photo';
import { AVATAR_ICONS } from './avatarIcons';
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
    // Plugins before 1.2.1 have no photo endpoint
    if (isAxiosError(error) && (error.config?.url ?? '').endsWith('/Image') && !getProfileErrorCode(error)) {
        return globalize.translate('ProfilePhotoUnsupported');
    }
    switch (getProfileErrorCode(error)) {
        case 'BadRequest':
            return isAxiosError<{ Message?: string }>(error) && error.response?.data?.Message ?
                error.response.data.Message :
                globalize.translate('ErrorDefault');
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
    const [ icon, setIcon ] = useState(AVATAR_ICONS[0].id);
    /** A photo picked but not uploaded yet. */
    const [ photo, setPhoto ] = useState<{ blob: Blob, url: string }>();
    const [ removePhoto, setRemovePhoto ] = useState(false);
    const [ photoError, setPhotoError ] = useState<string>();
    const [ isKids, setIsKids ] = useState(false);
    const [ pin, setPin ] = useState('');
    const [ removePin, setRemovePin ] = useState(false);
    const [ confirmDelete, setConfirmDelete ] = useState(false);

    const createProfile = useCreateProfile();
    const updateProfile = useUpdateProfile();
    const deleteProfile = useDeleteProfile();
    const setImage = useSetProfileImage();
    const removeImage = useRemoveProfileImage();
    const { reset: resetCreate } = createProfile;
    const { reset: resetUpdate } = updateProfile;
    const { reset: resetDelete } = deleteProfile;
    const { reset: resetSetImage } = setImage;
    const { reset: resetRemoveImage } = removeImage;
    const error = createProfile.error ?? updateProfile.error ?? deleteProfile.error ?? setImage.error ?? removeImage.error;
    const isBusy = createProfile.isPending || updateProfile.isPending || deleteProfile.isPending || setImage.isPending || removeImage.isPending;
    const hasSavedPhoto = !!profile?.PrimaryImageTag && !removePhoto;

    // Free the preview once it's replaced or the editor closes
    useEffect(() => () => {
        if (photo) URL.revokeObjectURL(photo.url);
    }, [ photo ]);

    useEffect(() => {
        if (!open) return;
        setName(profile?.Name ?? '');
        setColor(profile?.AvatarColor ?? AVATAR_COLORS[household.Profiles.length % AVATAR_COLORS.length]);
        // New profiles get a different icon each, like Netflix
        setIcon(profile?.AvatarIcon ?? AVATAR_ICONS[(household.Profiles.length * 5 + 3) % AVATAR_ICONS.length].id);
        setPhoto(undefined);
        setRemovePhoto(false);
        setPhotoError(undefined);
        setIsKids(profile?.IsKids ?? false);
        setPin('');
        setRemovePin(false);
        setConfirmDelete(false);
        resetCreate();
        resetUpdate();
        resetDelete();
        resetSetImage();
        resetRemoveImage();
    }, [ open, profile, household.Profiles.length, resetCreate, resetUpdate, resetDelete, resetSetImage, resetRemoveImage ]);

    /** Choosing a generated avatar means not using a photo. */
    const switchToGenerated = () => {
        setPhoto(undefined);
        if (profile?.PrimaryImageTag) setRemovePhoto(true);
    };

    const onPickIcon = (id: string) => {
        setIcon(id);
        switchToGenerated();
    };

    const onPickColor = (value: string) => {
        setColor(value);
        switchToGenerated();
    };

    const onSurprise = () => {
        const others = AVATAR_ICONS.filter(i => i.id !== icon);
        // Only picks an avatar, so Math.random is fine
        // eslint-disable-next-line sonarjs/pseudo-random
        setIcon(others[Math.floor(Math.random() * others.length)].id);
        // eslint-disable-next-line sonarjs/pseudo-random
        setColor(AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]);
        switchToGenerated();
    };

    const onPhotoPicked = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        setPhotoError(undefined);
        toSquarePhoto(file)
            .then(blob => {
                setPhoto({ blob, url: URL.createObjectURL(blob) });
                setRemovePhoto(false);
            })
            .catch(() => setPhotoError(globalize.translate('ProfilePhotoUnreadable')));
    };

    const onRemovePhoto = () => {
        setPhoto(undefined);
        setRemovePhoto(!!profile?.PrimaryImageTag);
    };

    const isPinValid = pin === '' || /^\d{4}$/.test(pin);
    const trimmedName = name.trim();

    const onSubmit = useCallback((e: FormEvent) => {
        e.preventDefault();
        if (!trimmedName || !isPinValid) return;

        const input: ProfileInput = { Name: trimmedName, AvatarColor: color, AvatarIcon: icon };
        if (canManage && !profile?.IsOwner) input.IsKids = isKids;
        if (pin) input.Pin = pin;
        else if (removePin) input.RemovePin = true;

        const save = async () => {
            const saved = profile ?
                await updateProfile.mutateAsync({ id: profile.Id, input }) :
                await createProfile.mutateAsync(input);
            if (photo) await setImage.mutateAsync({ id: saved.Id, image: photo.blob });
            else if (removePhoto) await removeImage.mutateAsync(saved.Id);
            onClose();
        };
        // Failures show in the dialog, from the mutations' own state
        save().catch(err => console.error('[profiles] saving the profile failed', err));
    }, [ trimmedName, isPinValid, color, icon, canManage, profile, isKids, pin, removePin, photo, removePhoto, onClose, updateProfile, createProfile, setImage, removeImage ]);

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
            maxWidth='md'
            slotProps={{ paper: { component: 'form', onSubmit, sx: { backgroundColor: 'background.default', backgroundImage: 'none' } } }}
        >
            <DialogTitle>
                {globalize.translate(isNew ? 'AddProfile' : 'EditProfile')}
            </DialogTitle>
            <DialogContent>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ pt: 1 }}>
                    <Stack spacing={1} sx={{ width: 160, flexShrink: 0, alignSelf: { xs: 'center', sm: 'flex-start' } }}>
                        <ProfileAvatar
                            profile={{ Id: profile?.Id ?? '', Name: name, AvatarColor: color, AvatarIcon: icon, PrimaryImageTag: profile?.PrimaryImageTag, IsKids: isKids }}
                            imageUrl={photo?.url ?? (removePhoto ? null : undefined)}
                        />
                        <Button component='label' size='small' variant='outlined' color='inherit' startIcon={<AddAPhoto />} disabled={isBusy}>
                            {globalize.translate(photo || hasSavedPhoto ? 'ChangeProfilePhoto' : 'UploadProfilePhoto')}
                            <input type='file' accept='image/jpeg,image/png,image/webp,image/*' hidden onChange={onPhotoPicked} />
                        </Button>
                        {(photo || hasSavedPhoto) && (
                            <Button size='small' color='inherit' startIcon={<DeleteOutline />} onClick={onRemovePhoto} disabled={isBusy}>
                                {globalize.translate('RemoveProfilePhoto')}
                            </Button>
                        )}
                        <Button size='small' color='inherit' startIcon={<Casino />} onClick={onSurprise} disabled={isBusy}>
                            {globalize.translate('SurpriseMe')}
                        </Button>
                        {photoError && <Typography variant='body2' sx={{ color: 'error.main' }}>{photoError}</Typography>}
                    </Stack>

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
                                {globalize.translate('ProfileIcon')}
                            </Typography>
                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(48px, 1fr))', gap: 1 }}>
                                {AVATAR_ICONS.map(option => {
                                    const isSelected = option.id === icon && !photo && !hasSavedPhoto;
                                    return (
                                        <ButtonBase
                                            key={option.id}
                                            onClick={() => onPickIcon(option.id)}
                                            aria-label={option.label}
                                            title={option.label}
                                            aria-pressed={isSelected}
                                            sx={{
                                                borderRadius: '6px',
                                                outline: isSelected ? '3px solid #fff' : 'none',
                                                outlineOffset: '2px',
                                                transition: 'transform 0.12s',
                                                '&:hover, &.Mui-focusVisible': { transform: 'scale(1.08)' }
                                            }}
                                        >
                                            <ProfileAvatar profile={{ Id: '', Name: option.label, AvatarColor: color, AvatarIcon: option.id, IsKids: false }} imageUrl={null} />
                                        </ButtonBase>
                                    );
                                })}
                            </Box>
                        </Box>

                        <Box>
                            <Typography variant='body2' sx={{ mb: 1, color: 'text.secondary' }}>
                                {globalize.translate('ProfileColor')}
                            </Typography>
                            <Stack direction='row' spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                                {AVATAR_COLORS.map(c => (
                                    <ButtonBase
                                        key={c}
                                        onClick={() => onPickColor(c)}
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
