import type { RouteObject } from 'react-router-dom';

import ConnectionRequired from 'components/ConnectionRequired';
import ErrorBoundary from 'components/router/ErrorBoundary';

export const PROFILES_APP_PATH = 'profiles';

/** The "Who's watching?" screen. It is full screen and shared by both the modern and legacy layouts. */
export const PROFILES_APP_ROUTES: RouteObject[] = [
    {
        Component: ConnectionRequired,
        children: [
            {
                path: PROFILES_APP_PATH,
                lazy: () => import('./profiles'),
                ErrorBoundary
            }
        ]
    }
];
