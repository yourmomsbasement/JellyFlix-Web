import '@mui/material/styles';

/** Extend MUI types to include our customizations. */
declare module '@mui/material/styles' {
    interface ColorSchemeOverrides {
        appletv: true;
        aurora: true;
        blueradiance: true;
        ember: true;
        jellyflix: true;
        midnight: true;
        purplehaze: true;
        wmc: true;
    }

    interface Palette {
        starIcon: Palette['primary'];
    }

    interface PaletteOptions {
        starIcon?: PaletteOptions['primary'];
    }
}
