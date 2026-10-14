import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import CheckCircle from '@mui/icons-material/CheckCircle';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import React, { type FC, useState } from 'react';

import { getRequestError } from 'apps/legacy/features/search/api/useRequests';
import { useApi } from 'hooks/useApi';
import globalize from 'lib/globalize';

import { type ArtworkKind, type ArtworkOption, getPreviewUrl, useArtworkOptions, useChooseArtwork } from '../api/useArtwork';

const OptionTile: FC<{ option: ArtworkOption, kind: ArtworkKind, disabled: boolean, onChoose: () => void }> = ({ option, kind, disabled, onChoose }) => {
    const { api } = useApi();
    const size = option.Width && option.Height ? `${option.Width}×${option.Height}` : '';
    const caption = [ option.IsDefault ? globalize.translate('ArtworkEveryone') : option.Source, option.Language?.toUpperCase(), size ].filter(Boolean).join(' · ');

    return (
        <Box>
            <ButtonBase
                onClick={onChoose}
                disabled={disabled}
                aria-pressed={option.IsSelected}
                aria-label={caption}
                sx={{
                    position: 'relative',
                    display: 'block',
                    width: '100%',
                    aspectRatio: kind === 'Poster' ? '2 / 3' : '16 / 9',
                    borderRadius: 1.5,
                    overflow: 'hidden',
                    backgroundColor: '#2a2a2a',
                    outline: option.IsSelected ? '3px solid' : '1px solid rgba(255, 255, 255, 0.12)',
                    outlineColor: option.IsSelected ? 'primary.main' : undefined,
                    outlineOffset: option.IsSelected ? 2 : 0,
                    transition: 'transform 0.15s',
                    '&:hover, &.Mui-focusVisible': { transform: 'scale(1.03)' }
                }}
            >
                {api && (
                    <Box
                        component='img'
                        src={getPreviewUrl(api, option, kind === 'Poster' ? 240 : 420)}
                        alt=''
                        loading='lazy'
                        sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                )}
                {option.IsSelected && (
                    <CheckCircle sx={{ position: 'absolute', top: 6, right: 6, color: 'primary.main', backgroundColor: '#fff', borderRadius: '50%' }} />
                )}
            </ButtonBase>
            <Typography sx={{ mt: 0.75, fontSize: '0.75rem', color: 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={caption}>
                {caption}
            </Typography>
        </Box>
    );
};

const OptionGrid: FC<{ item: BaseItemDto, kind: ArtworkKind }> = ({ item, kind }) => {
    const { data, isPending, isError, error } = useArtworkOptions(item.Id, kind, true);
    const choose = useChooseArtwork(item.Id);

    if (isPending) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>;
    if (isError) return <Alert severity='error'>{getRequestError(error)}</Alert>;

    const options = data?.Options ?? [];
    return (
        <>
            {data?.ProvidersFailed && <Alert severity='info' sx={{ mb: 2 }}>{globalize.translate('ArtworkProvidersFailed')}</Alert>}
            {choose.isError && <Alert severity='error' sx={{ mb: 2 }}>{getRequestError(choose.error)}</Alert>}
            {options.length ? (
                <Box
                    sx={{
                        display: 'grid',
                        gap: 2,
                        gridTemplateColumns: kind === 'Poster' ? 'repeat(auto-fill, minmax(120px, 1fr))' : 'repeat(auto-fill, minmax(220px, 1fr))',
                        opacity: choose.isPending ? 0.6 : 1
                    }}
                >
                    {options.map(option => (
                        <OptionTile
                            key={option.Id}
                            option={option}
                            kind={kind}
                            disabled={choose.isPending}
                            onChoose={() => choose.mutate({ kind, optionId: option.IsDefault ? null : option.Id })}
                        />
                    ))}
                </Box>
            ) : (
                <Typography sx={{ color: 'text.secondary', py: 4, textAlign: 'center' }}>{globalize.translate('ArtworkNoOptions')}</Typography>
            )}
        </>
    );
};

/**
 * Lets the signed-in profile pick its own poster and backdrop for a title. Other profiles keep seeing the
 * library's artwork.
 */
const ArtworkDialog: FC<{ item: BaseItemDto, open: boolean, onClose: () => void }> = ({ item, open, onClose }) => {
    const [ kind, setKind ] = useState<ArtworkKind>('Poster');
    const reset = useChooseArtwork(item.Id);

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth='md' scroll='paper'>
            <DialogTitle sx={{ pb: 0 }}>
                {globalize.translate('ChangeArtwork')}
                <Typography sx={{ color: 'text.secondary', mt: 0.5 }}>{globalize.translate('ChangeArtworkHelp', item.Name ?? '')}</Typography>
            </DialogTitle>
            <Tabs value={kind} onChange={(_e, value: ArtworkKind) => setKind(value)} sx={{ px: 3 }}>
                <Tab value='Poster' label={globalize.translate('ArtworkPoster')} />
                <Tab value='Backdrop' label={globalize.translate('ArtworkBackdrop')} />
            </Tabs>
            <DialogContent dividers sx={{ minHeight: 320 }}>
                {open && <OptionGrid key={kind} item={item} kind={kind} />}
            </DialogContent>
            <DialogActions>
                <Button color='inherit' disabled={reset.isPending} onClick={() => reset.mutate({ kind, optionId: null })}>
                    {globalize.translate('ArtworkUseDefault')}
                </Button>
                <Button variant='contained' onClick={onClose}>{globalize.translate('Done')}</Button>
            </DialogActions>
        </Dialog>
    );
};

export default ArtworkDialog;
