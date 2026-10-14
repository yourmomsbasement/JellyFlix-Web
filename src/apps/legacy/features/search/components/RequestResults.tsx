import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import React, { type FC, useState } from 'react';

import toast from 'components/toast/toast';
import globalize from 'lib/globalize';

import { getRequestError, type RequestableTitle, type RequestStatus, useCreateRequest, useRequestSearch } from '../api/useRequests';

const STATUS_LABELS: Partial<Record<RequestStatus, string>> = {
    Requested: 'RequestStatusRequested',
    Processing: 'RequestStatusProcessing',
    Blocked: 'RequestStatusBlocked'
};

/** Statuses that can still be requested; partly available shows ask for the rest. */
const isRequestable = (status: RequestStatus) => status === 'None' || status === 'PartiallyAvailable';

const RequestCard: FC<{ title: RequestableTitle }> = ({ title }) => {
    const createRequest = useCreateRequest();
    // Shown straight away; the search refreshes with Seerr's own status afterwards
    const [ status, setStatus ] = useState(title.Status);
    const [ error, setError ] = useState<string>();

    const onRequest = () => {
        setError(undefined);
        createRequest.mutate(title, {
            onSuccess: () => {
                setStatus('Requested');
                toast(globalize.translate('RequestSent', title.Title));
            },
            onError: err => setError(getRequestError(err))
        });
    };

    const kind = globalize.translate(title.MediaType === 'tv' ? 'Series' : 'Movie');
    const label = STATUS_LABELS[status];

    return (
        <Box component='li' sx={{ listStyle: 'none', width: '10em', flex: '0 0 auto' }}>
            <Box
                sx={{
                    position: 'relative',
                    width: '10em',
                    height: '15em',
                    borderRadius: '0.4em',
                    overflow: 'hidden',
                    backgroundColor: '#2a2a2a',
                    backgroundImage: title.PosterUrl ? `url("${title.PosterUrl}")` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    // Not in the library yet: a little dimmer than real cards
                    filter: 'saturate(0.85)'
                }}
            >
                {!title.PosterUrl && (
                    <Typography sx={{ p: 1, fontWeight: 600 }}>{title.Title}</Typography>
                )}
                {status === 'PartiallyAvailable' && (
                    <Box sx={{ position: 'absolute', top: 6, left: 6, px: 0.75, borderRadius: 1, backgroundColor: 'rgba(0, 0, 0, 0.75)', fontSize: '0.75em', fontWeight: 600 }}>
                        {globalize.translate('RequestStatusPartial')}
                    </Box>
                )}
            </Box>
            <Typography sx={{ mt: 1, fontWeight: 600, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={title.Title}>
                {title.Title}
            </Typography>
            <Typography sx={{ color: 'text.secondary', fontSize: '0.85em', mb: 1 }}>
                {[ title.Year, kind ].filter(Boolean).join(' · ')}
            </Typography>
            {isRequestable(status) ? (
                <Button
                    size='small'
                    variant='contained'
                    fullWidth
                    onClick={onRequest}
                    disabled={createRequest.isPending}
                >
                    {globalize.translate(status === 'PartiallyAvailable' ? 'ButtonRequestMore' : 'ButtonRequest')}
                </Button>
            ) : (
                <Box sx={{ py: 0.5, textAlign: 'center', borderRadius: 1, border: '1px solid rgba(255, 255, 255, 0.2)', color: 'text.secondary', fontSize: '0.85em' }}>
                    {label ? globalize.translate(label) : ''}
                </Box>
            )}
            {error && <Typography sx={{ mt: 0.5, color: 'error.main', fontSize: '0.8em' }}>{error}</Typography>}
        </Box>
    );
};

/**
 * Below the search results: matching movies and shows that aren't in the library, with a Request button that goes
 * through Seerr. Only shown when the JellyFlix plugin has requests turned on and the profile may request.
 */
const RequestResults: FC<{ query: string }> = ({ query }) => {
    const { data } = useRequestSearch(query.trim());
    if (!data?.IsEnabled || !data.CanRequest || !data.Results.length) return null;

    return (
        <Box component='section' className='verticalSection padded-left padded-right' sx={{ pb: 4 }}>
            <h2 className='sectionTitle sectionTitle-cards'>{globalize.translate('NotInYourLibrary')}</h2>
            <Typography sx={{ color: 'text.secondary', mb: 2 }}>{globalize.translate('NotInYourLibraryHelp')}</Typography>
            <Box component='ul' sx={{ display: 'flex', flexWrap: 'wrap', gap: '1.5em 1em', p: 0, m: 0 }}>
                {data.Results.map(title => <RequestCard key={`${title.MediaType}-${title.TmdbId}`} title={title} />)}
            </Box>
        </Box>
    );
};

export default RequestResults;
