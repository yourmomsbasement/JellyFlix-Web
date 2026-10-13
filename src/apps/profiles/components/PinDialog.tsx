import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import React, { type ChangeEvent, type FC, useCallback, useEffect, useRef, useState } from 'react';

import globalize from 'lib/globalize';

import type { Profile } from '../api/profiles';
import ProfileAvatar from './ProfileAvatar';

const PIN_LENGTH = 4;

interface PinDialogProps {
    profile?: Profile
    error?: string
    isSubmitting: boolean
    onSubmit: (pin: string) => void
    onClose: () => void
}

/** Asks for a profile's 4-digit PIN and submits as soon as all digits are entered. */
const PinDialog: FC<PinDialogProps> = ({ profile, error, isSubmitting, onSubmit, onClose }) => {
    const [ pin, setPin ] = useState('');
    const inputRef = useRef<HTMLInputElement | null>(null);
    // The dialog mounts its content a render after opening, so focus the input as soon as it exists.
    const setInputRef = useCallback((el: HTMLInputElement | null) => {
        inputRef.current = el;
        el?.focus();
    }, []);

    // Start over whenever the dialog opens or a PIN is rejected.
    useEffect(() => {
        setPin('');
        inputRef.current?.focus();
    }, [ profile, error ]);

    const onChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, PIN_LENGTH);
        setPin(value);
        if (value.length === PIN_LENGTH) onSubmit(value);
    }, [ onSubmit ]);

    return (
        <Dialog
            open={!!profile}
            onClose={onClose}
            fullScreen
            slotProps={{
                paper: { sx: { backgroundColor: 'rgba(0, 0, 0, 0.92)', backgroundImage: 'none' } }
            }}
        >
            <Box
                sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 3,
                    px: 2,
                    textAlign: 'center'
                }}
                onClick={() => inputRef.current?.focus()}
            >
                {profile && <ProfileAvatar profile={profile} size='96px' />}
                <Typography variant='h5' component='h1' sx={{ color: '#fff' }}>
                    {globalize.translate('EnterProfilePin')}
                </Typography>

                <Box sx={{ position: 'relative', display: 'flex', gap: 1.5 }}>
                    {Array.from({ length: PIN_LENGTH }, (_, i) => (
                        <Box
                            key={i}
                            sx={{
                                width: 56,
                                height: 64,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '2px solid',
                                borderColor: i === pin.length ? '#fff' : 'rgba(255, 255, 255, 0.5)',
                                borderRadius: '4px',
                                fontSize: '2rem',
                                color: '#fff'
                            }}
                        >
                            {i < pin.length ? '•' : ''}
                        </Box>
                    ))}
                    {/* One real input sits over the boxes so mobile keyboards, paste and screen readers all work. */}
                    <input
                        ref={setInputRef}
                        value={pin}
                        onChange={onChange}
                        disabled={isSubmitting}
                        inputMode='numeric'
                        autoComplete='off'
                        aria-label={globalize.translate('EnterProfilePin')}
                        maxLength={PIN_LENGTH}
                        style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%' }}
                    />
                </Box>

                <Typography role='alert' sx={{ minHeight: '1.5em', color: '#e87c03' }}>
                    {error}
                </Typography>

                <Button variant='outlined' color='inherit' onClick={onClose} sx={{ color: '#fff' }}>
                    {globalize.translate('ButtonCancel')}
                </Button>
            </Box>
        </Dialog>
    );
};

export default PinDialog;
