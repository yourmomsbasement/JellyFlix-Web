import Alert, { type AlertColor } from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import Collapse from '@mui/material/Collapse';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import LinearProgress from '@mui/material/LinearProgress';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import React, { type FC, type ReactNode } from 'react';

export const Section: FC<{ title: string, description: string, children?: ReactNode }> = ({ title, description, children }) => (
    <Paper sx={{ p: 3 }}>
        <Typography variant='h2' sx={{ mb: 1 }}>{title}</Typography>
        <Typography sx={{ color: 'text.secondary', mb: children ? 3 : 0 }}>{description}</Typography>
        {children && <Stack spacing={3}>{children}</Stack>}
    </Paper>
);

export const Check: FC<{ label: string, help?: string, checked: boolean, onChange: (checked: boolean) => void }> = ({ label, help, checked, onChange }) => (
    <Box>
        <FormControlLabel control={<Checkbox checked={checked} onChange={e => onChange(e.target.checked)} />} label={label} />
        {help && <FormHelperText sx={{ mt: 0, ml: 4 }}>{help}</FormHelperText>}
    </Box>
);

/** The outcome of a button press, shown in a panel underneath it. */
export const ResultPanel: FC<{ severity?: AlertColor, title?: string, isPending?: boolean, pendingText?: string, progress?: number | null, children?: ReactNode, action?: ReactNode }> = ({
    severity,
    title,
    isPending,
    pendingText,
    progress,
    children,
    action
}) => (
    <Collapse in={isPending || !!severity} unmountOnExit>
        {isPending ? (
            <Box sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                <Typography sx={{ mb: 1.5 }}>{pendingText}</Typography>
                <LinearProgress variant={progress == null ? 'indeterminate' : 'determinate'} value={progress ?? undefined} />
            </Box>
        ) : (
            <Alert severity={severity} variant='outlined' action={action} sx={{ alignItems: 'center' }}>
                {title && <AlertTitle sx={{ fontWeight: 700 }}>{title}</AlertTitle>}
                {children}
            </Alert>
        )}
    </Collapse>
);
