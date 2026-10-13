import type { RouteObject } from 'react-router-dom';

/** Pages the TV layout replaces with Netflix-style ones built for the remote. */
export const TV_PATHS = [ 'home', 'title' ];

export const TV_ROUTES: RouteObject[] = [
    {
        path: 'home',
        lazy: async () => ({ Component: (await import('./home')).default })
    },
    {
        path: 'title',
        lazy: async () => ({ Component: (await import('./title')).default })
    }
];
