/**
 * Sizes for the TV pages. Everything is in viewport units so the layout looks the same on 720p and 4K screens
 * (TV browsers report anything from 960 to 1920 CSS pixels wide).
 */

/** Width of the collapsed side menu. */
export const RAIL_WIDTH = '5.5vw';
/** Left edge of page content, right of the menu. */
export const CONTENT_LEFT = '7vw';
/** Poster tile size; 2:3 artwork. (Explicit heights: older TV browsers don't support `aspect-ratio`.) */
export const POSTER_WIDTH = '10.2vw';
export const POSTER_HEIGHT = '15.3vw';
/** Gap between tiles. */
export const TILE_GAP = '0.7vw';

export const BACKGROUND = '#141414';
export const NETFLIX_RED = '#e50914';

/** The white ring Netflix draws around the focused tile. */
export const focusRingSx = {
    outline: '0.22vw solid transparent',
    outlineOffset: '0.18vw',
    transition: 'outline-color 0.15s, transform 0.2s',
    '&:focus': {
        outlineColor: '#fff',
        transform: 'scale(1.04)'
    }
} as const;

/** Netflix TV pill buttons: dark until focused, then white. */
export const tvPillSx = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.6vw',
    height: '3.4vw',
    px: '1.8vw',
    border: 0,
    borderRadius: '999px',
    backgroundColor: 'rgba(109, 109, 110, 0.55)',
    color: '#fff',
    fontFamily: 'inherit',
    fontSize: '1.25vw',
    fontWeight: 600,
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    outline: 'none',
    transition: 'background-color 0.15s, color 0.15s, transform 0.15s',
    '& svg': { fontSize: '1.8vw' },
    '&:focus': {
        backgroundColor: '#fff',
        color: '#000',
        transform: 'scale(1.05)'
    }
} as const;
