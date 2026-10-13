import { buildCustomColorScheme } from 'themes/utils';

/** The "JellyFlix" color scheme: Netflix-style near-black with a red accent. */
const theme = buildCustomColorScheme({
    palette: {
        primary: {
            main: '#e50914',
            dark: '#b20710',
            light: '#f6121d',
            contrastText: '#fff'
        },
        secondary: {
            main: '#e50914',
            contrastText: '#fff'
        },
        background: {
            default: '#141414',
            paper: '#181818'
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
