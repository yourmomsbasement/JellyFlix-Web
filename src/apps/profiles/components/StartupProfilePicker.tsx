import { type FC, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useApi } from 'hooks/useApi';

import { getStartupPickerUrl } from '../startup';

/** Sends the first signed-in page of each app start to "Who's watching?". */
const StartupProfilePicker: FC = () => {
    const { user } = useApi();
    const { pathname, search } = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) return;
        const url = getStartupPickerUrl(pathname, search);
        if (url) navigate(url, { replace: true });
    }, [ user, pathname, search, navigate ]);

    return null;
};

export default StartupProfilePicker;
