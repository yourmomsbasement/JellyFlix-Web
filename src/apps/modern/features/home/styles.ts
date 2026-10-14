/** Shared Netflix-style button looks. */

/** Rounded "pill" buttons, as on Netflix's TV app. */
export const pillSx = {
    borderRadius: 999,
    px: { xs: 2.5, md: 4 },
    py: { md: 1.1 },
    fontSize: { xs: '1rem', md: '1.15rem' },
    fontWeight: 600,
    boxShadow: 'none'
};

/** The light secondary pill (Watch Trailer, More Info). */
export const lightPillSx = {
    ...pillSx,
    color: '#141414',
    backgroundColor: '#e5e5e5',
    '&:hover': { backgroundColor: '#fff' }
};

/** Round outlined icon buttons (My List, thumbs, more). */
export const roundIconSx = {
    p: { xs: 0.75, md: 1 },
    color: '#fff',
    border: '2px solid rgba(255, 255, 255, 0.6)',
    '&:hover': { borderColor: '#fff', backgroundColor: 'rgba(255, 255, 255, 0.1)' }
};

/** Netflix's "98% Match" green. */
/** The match percentage, in the theme's color for it. */
export const MATCH_GREEN = 'var(--jf-palette-success-main)';
