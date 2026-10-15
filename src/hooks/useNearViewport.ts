import { useEffect, useState } from 'react';

interface NearViewportOptions {
    /** The scrolling or clipping container the element moves through; the viewport by default. */
    root?: Element | null
    /** How far outside the root still counts as near, e.g. one screen below: '0px 0px 100% 0px'. */
    rootMargin?: string
}

const isSupported = typeof IntersectionObserver !== 'undefined';

/**
 * Whether an element is on screen or close to it, once and for good: rows use it to load their titles and posters only
 * as the viewer gets near them. Returns a ref callback for the element. Browsers without IntersectionObserver get true
 * straight away.
 */
export const useNearViewport = ({ root = null, rootMargin = '100% 0px' }: NearViewportOptions = {}) => {
    const [ element, setElement ] = useState<Element | null>(null);
    const [ isNear, setIsNear ] = useState(!isSupported);

    useEffect(() => {
        if (isNear || !element) return;
        const observer = new IntersectionObserver(entries => {
            // isIntersecting is missing in Chromium before 58 (older TVs)
            if (entries.some(entry => entry.isIntersecting ?? entry.intersectionRatio > 0)) {
                setIsNear(true);
                observer.disconnect();
            }
        }, { root, rootMargin });
        observer.observe(element);
        return () => observer.disconnect();
    }, [ element, isNear, root, rootMargin ]);

    return [ setElement, isNear ] as const;
};
