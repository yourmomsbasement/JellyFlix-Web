/**
 * "Who's watching?" on every app start: each full page load (opening the app, a refresh) asks which profile is
 * watching before showing anything else, like Netflix does. Navigating inside the app never asks again.
 */

import { PROFILES_APP_PATH } from './routes/routes';

const DEFAULT_TARGET = '/home';
const JUST_SWITCHED_KEY = 'jellyflix-profile-just-switched';

/** Pages that must open directly: sign in, playback, setup and the server dashboard. */
const SKIPPED_PATHS = [
    PROFILES_APP_PATH,
    'login',
    'selectserver',
    'addserver',
    'forgotpassword',
    'forgotpasswordpin',
    'wizard',
    'video',
    'queue',
    'dashboard',
    'metadata',
    'configurationpage'
];

// Switching profiles reloads the page; that reload must not ask again.
let hasAskedThisLoad = (() => {
    try {
        const justSwitched = sessionStorage.getItem(JUST_SWITCHED_KEY) !== null;
        sessionStorage.removeItem(JUST_SWITCHED_KEY);
        return justSwitched;
    } catch {
        return false;
    }
})();

/** Remembers that the next page load comes from a profile switch. */
export const markProfileSwitch = () => {
    try {
        sessionStorage.setItem(JUST_SWITCHED_KEY, '1');
    } catch {
        // Without storage the picker shows once more after switching, which is harmless
    }
};

/**
 * Returns the picker URL to show on this page load, or undefined when the app should carry on.
 * Only the first signed-in page of a load is considered.
 */
export const getStartupPickerUrl = (pathname: string, search: string) => {
    if (hasAskedThisLoad) return undefined;
    hasAskedThisLoad = true;

    const first = pathname.split('/').find(Boolean) ?? '';
    if (SKIPPED_PATHS.includes(first.toLowerCase())) return undefined;

    const target = first ? pathname + search : DEFAULT_TARGET;
    return `/${PROFILES_APP_PATH}?from=start&return=${encodeURIComponent(target)}`;
};

/** The in-app path to continue to after picking, from the picker's `return` parameter. */
export const getReturnTarget = (value: string | null) => (
    // Only paths inside the app; never another origin
    value?.startsWith('/') && !value.startsWith('//') ? value : DEFAULT_TARGET
);
