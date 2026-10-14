import type { ThemeOptions } from '@mui/material/styles';

/**
 * A cleaner, more modern look for the admin dashboard with the JellyFlix theme: rounded cards with hairline borders,
 * rounded inputs with a red focus ring, pill-shaped menu items and lighter section headings.
 *
 * Every rule is scoped to the dashboard (`body.dashboardDocument`) under the JellyFlix color scheme, so other themes
 * and the Netflix-style pages keep their own look.
 */
const DASHBOARD = '[data-theme="jellyflix"] body.dashboardDocument &';

const RED = '229 9 20';
const HAIRLINE = '1px solid rgba(255, 255, 255, 0.08)';
const RADIUS = 12;

const inDashboard = (styles: object) => ({ [DASHBOARD]: styles });
/** For the dashboard's side menu. */
const inDashboardDrawer = (styles: object) => ({ [DASHBOARD.replace(' &', ' .MuiDrawer-paper &')]: styles });

export const JELLYFLIX_DASHBOARD_COMPONENTS: ThemeOptions['components'] = {
    MuiPaper: {
        styleOverrides: {
            root: inDashboard({
                // Dark-mode elevation overlays make cards look muddy; a hairline border reads cleaner
                backgroundImage: 'none',
                border: HAIRLINE
            }),
            rounded: inDashboard({
                borderRadius: RADIUS
            })
        }
    },
    MuiAppBar: {
        styleOverrides: {
            root: inDashboard({
                border: 0,
                borderRadius: 0,
                backgroundColor: 'rgb(var(--jf-palette-background-defaultChannel) / 0.85)',
                backdropFilter: 'blur(12px)',
                borderBottom: HAIRLINE
            })
        }
    },
    MuiDrawer: {
        styleOverrides: {
            paper: inDashboard({
                border: 0,
                borderRight: HAIRLINE,
                borderRadius: 0,
                backgroundColor: '#101010'
            })
        }
    },
    MuiListSubheader: {
        styleOverrides: {
            root: inDashboardDrawer({
                marginTop: 8,
                lineHeight: '32px',
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'rgba(255, 255, 255, 0.45)'
            })
        }
    },
    MuiListItemButton: {
        styleOverrides: {
            root: inDashboardDrawer({
                margin: '1px 10px',
                padding: '6px 12px',
                borderRadius: 8,
                '& .MuiListItemIcon-root': { color: 'rgba(255, 255, 255, 0.6)' },
                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.06)' },
                '&.Mui-selected, &.Mui-selected:hover': {
                    backgroundColor: `rgb(${RED} / 0.16)`,
                    '& .MuiListItemIcon-root': { color: `rgb(${RED})` },
                    '& .MuiListItemText-primary': { fontWeight: 600 }
                }
            })
        }
    },
    MuiCard: {
        styleOverrides: {
            root: inDashboard({
                borderRadius: RADIUS,
                transition: 'border-color 0.15s, transform 0.15s',
                '&:hover': { borderColor: 'rgba(255, 255, 255, 0.18)' }
            })
        }
    },
    MuiFilledInput: {
        styleOverrides: {
            root: inDashboard({
                borderRadius: 10,
                border: HAIRLINE,
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                transition: 'border-color 0.15s, box-shadow 0.15s, background-color 0.15s',
                '&::before, &::after': { display: 'none' },
                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.08)' },
                '&.Mui-focused': {
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    borderColor: `rgb(${RED})`,
                    boxShadow: `0 0 0 3px rgb(${RED} / 0.25)`
                },
                '&.Mui-error': { borderColor: '#f44336' }
            })
        }
    },
    MuiFormHelperText: {
        styleOverrides: {
            root: inDashboard({
                marginLeft: 4,
                fontSize: '0.875rem',
                color: 'rgba(255, 255, 255, 0.55)'
            })
        }
    },
    MuiButton: {
        styleOverrides: {
            root: inDashboard({
                borderRadius: 8,
                fontWeight: 600,
                boxShadow: 'none',
                '&:hover': { boxShadow: 'none' }
            }),
            outlined: inDashboard({
                borderColor: 'rgba(255, 255, 255, 0.25)',
                color: '#fff',
                '&:hover': { borderColor: '#fff', backgroundColor: 'rgba(255, 255, 255, 0.06)' }
            })
        }
    },
    MuiToggleButton: {
        styleOverrides: {
            root: inDashboard({
                textTransform: 'none',
                '&.Mui-selected': { backgroundColor: `rgb(${RED} / 0.2)` }
            })
        }
    },
    MuiChip: {
        styleOverrides: {
            root: inDashboard({
                borderRadius: 8,
                fontWeight: 500
            })
        }
    },
    MuiAlert: {
        styleOverrides: {
            root: inDashboard({
                borderRadius: RADIUS
            })
        }
    },
    MuiDialog: {
        styleOverrides: {
            paper: inDashboard({
                borderRadius: 16
            })
        }
    },
    MuiTypography: {
        styleOverrides: {
            h1: inDashboard({
                color: '#fff',
                fontSize: '2rem',
                fontWeight: 700,
                letterSpacing: '-0.01em'
            }),
            h2: inDashboard({
                fontWeight: 600
            }),
            h3: inDashboard({
                fontWeight: 600
            })
        }
    }
};
