import { buildCustomColorScheme } from 'themes/utils';

/** The "JellyFlix" color scheme: Netflix-style near-black with a red accent. */
const theme = buildCustomColorScheme({
    palette: {
        // The channels are spelled out: the scheme is merged over MUI's dark one, whose precomputed (blue) channels
        // would otherwise tint selected and hovered items
        primary: {
            main: '#e50914',
            mainChannel: '229 9 20',
            dark: '#b20710',
            darkChannel: '178 7 16',
            light: '#f6121d',
            lightChannel: '246 18 29',
            contrastText: '#fff',
            contrastTextChannel: '255 255 255'
        },
        secondary: {
            main: '#e50914',
            mainChannel: '229 9 20',
            contrastText: '#fff',
            contrastTextChannel: '255 255 255'
        },
        // Netflix keeps everything that isn't red neutral
        info: {
            main: '#6d6d6e',
            mainChannel: '109 109 110',
            contrastText: '#fff',
            contrastTextChannel: '255 255 255'
        },
        success: {
            main: '#46d369',
            mainChannel: '70 211 105'
        },
        background: {
            default: '#141414',
            defaultChannel: '20 20 20',
            paper: '#181818',
            paperChannel: '24 24 24'
        },
        text: {
            primary: '#fff',
            secondary: '#b3b3b3'
        },
        action: {
            hover: 'rgba(255, 255, 255, 0.1)',
            focus: 'rgba(255, 255, 255, 0.16)'
        },
        divider: 'rgba(255, 255, 255, 0.1)',
        AppBar: {
            defaultBg: '#141414'
        },
        Button: {
            inheritContainedBg: 'rgba(109, 109, 110, 0.7)',
            inheritContainedHoverBg: 'rgba(109, 109, 110, 0.4)'
        },
        FilledInput: {
            bg: '#333'
        },
        SnackbarContent: {
            bg: '#e5e5e5',
            color: '#141414'
        }
    }
});

export default theme;
