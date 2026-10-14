import { describe, expect, it } from 'vitest';

import { contrastWithWhite, fromHex, pickAccent, toHex, toReadableAccent } from './accentColor';

const image = (...pixels: [ number, number, number, number ][]) => new Uint8ClampedArray(pixels.flat());
const repeat = (pixel: [ number, number, number ], count: number) => Array.from({ length: count }, () => [ ...pixel, 255 ] as [ number, number, number, number ]);

describe('pickAccent', () => {
    it('finds the vivid color among greys', () => {
        const accent = pickAccent(image(...repeat([ 120, 120, 120 ], 80), ...repeat([ 30, 30, 30 ], 60), ...repeat([ 200, 30, 40 ], 20)));
        expect(accent).not.toBeNull();
        const [ r, g, b ] = accent!;
        expect(r).toBeGreaterThan(g * 3);
        expect(r).toBeGreaterThan(b * 3);
    });

    it('prefers the dominant vivid hue', () => {
        const [ r, g, b ] = pickAccent(image(...repeat([ 20, 90, 200 ], 50), ...repeat([ 220, 140, 20 ], 10)))!;
        expect(b).toBeGreaterThan(r);
        expect(b).toBeGreaterThan(g);
    });

    it('gives nothing for black-and-white artwork', () => {
        expect(pickAccent(image(...repeat([ 10, 10, 10 ], 50), ...repeat([ 240, 240, 240 ], 50), ...repeat([ 128, 128, 128 ], 50)))).toBeNull();
    });

    it('ignores transparent pixels', () => {
        expect(pickAccent(image([ 255, 0, 0, 0 ], [ 255, 0, 0, 0 ]))).toBeNull();
    });
});

describe('toReadableAccent', () => {
    it.each([ '#ffff00', '#00ff00', '#66ccff', '#ff9900', '#cc0000', '#7b5cff' ])('keeps white text readable on %s', hex => {
        const accent = toReadableAccent(fromHex(hex));
        expect(contrastWithWhite(accent)).toBeGreaterThanOrEqual(4.5);
    });

    it('keeps the hue', () => {
        expect(toHex(toReadableAccent(fromHex('#0000ff')))).toMatch(/^#[0-3][0-9a-f][0-3][0-9a-f][a-f][0-9a-f]$/);
    });
});
