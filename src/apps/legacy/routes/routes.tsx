import { Navigate, RouteObject } from 'react-router-dom';
import React from 'react';

import { TV_PATHS, TV_ROUTES } from 'apps/tv/routes/routes';
import ConnectionRequired from 'components/ConnectionRequired';
import layoutManager from 'components/layoutManager';
import { toAsyncPageRoute } from 'components/router/AsyncRoute';
import { toViewManagerPageRoute } from 'components/router/LegacyRoute';
import ErrorBoundary from 'components/router/ErrorBoundary';
import FallbackRoute from 'components/router/FallbackRoute';

import AppLayout from '../AppLayout';

import { ASYNC_PUBLIC_ROUTES, ASYNC_USER_ROUTES } from './asyncRoutes';
import { LEGACY_PUBLIC_ROUTES, LEGACY_USER_ROUTES } from './legacyRoutes';

export const APP_ROUTES: RouteObject[] = [
    {
        path: '/*',
        Component: AppLayout,
        children: [
            { index: true, element: <Navigate replace to='/home' /> },

            {
                /* User routes */
                Component: ConnectionRequired,
                children: [
                    ...ASYNC_USER_ROUTES.map(toAsyncPageRoute),
                    // JellyFlix: Netflix-style Home and title pages for the TV layout
                    ...(layoutManager.tv ? TV_ROUTES : []),
                    ...LEGACY_USER_ROUTES
                        .filter(route => !layoutManager.tv || !TV_PATHS.includes(route.path))
                        .map(toViewManagerPageRoute)
                ],
                ErrorBoundary
            },

            {
                /* Public routes */
                element: <ConnectionRequired level='public' />,
                children: [
                    ...ASYNC_PUBLIC_ROUTES.map(toAsyncPageRoute),
                    ...LEGACY_PUBLIC_ROUTES.map(toViewManagerPageRoute),
                    /* Fallback route for invalid paths */
                    {
                        path: '*',
                        Component: FallbackRoute
                    }
                ]
            }

        ]
    }
];
