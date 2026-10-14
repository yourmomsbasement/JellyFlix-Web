type Rgb = [ number, number, number ];

const HUE_BUCKETS = 24;
/** The winning hue must cover at least this share of the (weighted) image, or the artwork has no real accent. */
const MIN_SHARE = 0.03;
/** White text on accent buttons stays readable (WCAG AA). */
const MIN_CONTRAST = 4.5;

const rgbToHsl = ([ r, g, b ]: Rgb): Rgb => {
    const [ rn, gn, bn ] = [ r / 255, g / 255, b / 255 ];
    const max = Math.max(rn, gn, bn);
    const min = Math.min(rn, gn, bn);
    const l = (max + min) / 2;
    if (max === min) return [ 0, 0, l ];
    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    let h;
    if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
    else if (max === gn) h = ((bn - rn) / d + 2) / 6;
    else h = ((rn - gn) / d + 4) / 6;
    return [ h, s, l ];
};

const hslToRgb = ([ h, s, l ]: Rgb): Rgb => {
    const hueToChannel = (p: number, q: number, t: number) => {
        const tt = (t + 1) % 1;
        if (tt < 1 / 6) return p + (q - p) * 6 * tt;
        if (tt < 1 / 2) return q;
        if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
        return p;
    };
    if (s === 0) return [ l * 255, l * 255, l * 255 ];
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    return [ hueToChannel(p, q, h + 1 / 3), hueToChannel(p, q, h), hueToChannel(p, q, h - 1 / 3) ].map(c => Math.round(c * 255)) as Rgb;
};

const luminance = (rgb: Rgb) => {
    const [ r, g, b ] = rgb.map(c => {
        const v = c / 255;
        return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/** Contrast of white text on a color. */
export const contrastWithWhite = (rgb: Rgb) => 1.05 / (luminance(rgb) + 0.05);

/**
 * The most prominent vivid color in some pixels (RGBA, as from a canvas): pixels are grouped by hue, weighted by how
 * saturated and bright they are, so a red car on a grey street wins over the street. Null for grey artwork.
 */
export const pickAccent = (pixels: Uint8ClampedArray): Rgb | null => {
    const buckets = Array.from({ length: HUE_BUCKETS }, () => ({ weight: 0, r: 0, g: 0, b: 0 }));
    let total = 0;
    for (let i = 0; i < pixels.length; i += 4) {
        if (pixels[i + 3] < 128) continue;
        const rgb: Rgb = [ pixels[i], pixels[i + 1], pixels[i + 2] ];
        const [ h, s, l ] = rgbToHsl(rgb);
        total++;
        // Skip greys, near-black and near-white: they're not an accent
        if (s < 0.25 || l < 0.12 || l > 0.9) continue;
        const weight = s * s * (1 - Math.abs(l - 0.5));
        const bucket = buckets[Math.floor(h * HUE_BUCKETS) % HUE_BUCKETS];
        bucket.weight += weight;
        bucket.r += rgb[0] * weight;
        bucket.g += rgb[1] * weight;
        bucket.b += rgb[2] * weight;
    }
    if (!total) return null;

    // Neighbouring hues count a little, so a gradient across a bucket edge isn't split in two
    const scored = buckets.map((bucket, i) => ({
        bucket,
        score: bucket.weight + 0.5 * (buckets[(i + HUE_BUCKETS - 1) % HUE_BUCKETS].weight + buckets[(i + 1) % HUE_BUCKETS].weight)
    }));
    const best = scored.reduce((a, b) => (b.score > a.score ? b : a), scored[0]);
    if (best.bucket.weight < total * MIN_SHARE * 0.25) return null;

    const { weight, r, g, b } = best.bucket;
    return [ r / weight, g / weight, b / weight ];
};

/**
 * Tones a color into a subtle, readable accent: rich but not neon, and dark enough for white text on buttons.
 */
export const toReadableAccent = (rgb: Rgb): Rgb => {
    const [ h, s ] = rgbToHsl(rgb);
    const saturation = Math.min(0.85, Math.max(0.45, s));
    let lightness = 0.5;
    let result = hslToRgb([ h, saturation, lightness ]);
    while (contrastWithWhite(result) < MIN_CONTRAST && lightness > 0.2) {
        lightness -= 0.02;
        result = hslToRgb([ h, saturation, lightness ]);
    }
    return result;
};

export const toHex = (rgb: Rgb) => '#' + rgb.map(c => Math.round(c).toString(16).padStart(2, '0')).join('');

export const fromHex = (hex: string): Rgb => [ 1, 3, 5 ].map(i => parseInt(hex.slice(i, i + 2), 16)) as Rgb;

/** A lighter or darker shade, for hover and pressed states. */
export const shade = (hex: string, amount: number) => {
    const [ h, s, l ] = rgbToHsl(fromHex(hex));
    return toHex(hslToRgb([ h, s, Math.min(0.9, Math.max(0.05, l + amount)) ]));
};

const SAMPLE_WIDTH = 48;
const SAMPLE_HEIGHT = 27;

/** Reads an image's accent color; null when it has none or can't be read (e.g. a cross-origin image). */
export const extractAccentColor = (url: string) => new Promise<string | null>(resolve => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = SAMPLE_WIDTH;
            canvas.height = SAMPLE_HEIGHT;
            const context = canvas.getContext('2d', { willReadFrequently: true });
            if (!context) return resolve(null);
            context.drawImage(image, 0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT);
            const accent = pickAccent(context.getImageData(0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT).data);
            resolve(accent ? toHex(toReadableAccent(accent)) : null);
        } catch {
            resolve(null);
        }
    };
    image.onerror = () => resolve(null);
    image.src = url;
});
